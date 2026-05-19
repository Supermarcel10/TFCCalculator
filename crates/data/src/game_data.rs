use std::collections::HashMap;

use rust_embed::RustEmbed;
use serde::Deserialize;
use tfcc_types::{
    BaseGameVersion, GameVersions, Mineral, SmeltingOutput, SmeltingOutputType, VersionType,
};

#[derive(RustEmbed)]
#[folder = "data/"]
struct DataAssets;

static METADATA_KEYS: &[&str] = &["lastUpdated", "version", "schemaVersion"];

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct VersionKey {
    pub version_type: VersionType,
    pub id: String,
    pub version: String,
}

#[derive(Debug, Clone, Deserialize)]
struct OutputsFileRaw {
    metals: Vec<SmeltingOutput>,
    alloys: Vec<SmeltingOutput>,
}

pub type OutputsFile = Vec<SmeltingOutput>;
pub type MineralsFile = HashMap<String, Vec<Mineral>>;

#[derive(Debug, Clone)]
pub struct GameData {
    pub game_versions: GameVersions,
    outputs: HashMap<VersionKey, OutputsFile>,
    minerals: HashMap<VersionKey, MineralsFile>,
}

impl GameData {
    pub fn load() -> Self {
        Self {
            game_versions: Self::load_game_versions().expect("failed to load gameversions.json  "),
            outputs: Self::load_outputs(),
            minerals: Self::load_minerals(),
        }
    }

    fn load_game_versions() -> Option<GameVersions> {
        let file = DataAssets::get("gameversions.json")?;
        serde_json::from_slice(&file.data).ok()
    }

    fn load_outputs() -> HashMap<VersionKey, OutputsFile> {
        let mut map = HashMap::new();

        for path in DataAssets::iter() {
            let path_str = path.as_ref();
            if !path_str.ends_with("outputs.json") {
                continue;
            }

            let Some(key) = Self::parse_version_key(path_str) else {
                continue;
            };

            let Some(file) = DataAssets::get(path_str) else {
                continue;
            };

            let raw_data: OutputsFileRaw = match serde_json::from_slice(&file.data) {
                Ok(v) => v,
                Err(e) => {
                    tracing::warn!(path = path_str, error = %e, "invalid outputs.json, skipping");
                    continue;
                }
            };

            let metals = raw_data.metals.into_iter().map(|mut m| {
                m.output_type = SmeltingOutputType::Metal;
                m
            });

            let alloys = raw_data.alloys.into_iter().map(|mut a| {
                a.output_type = SmeltingOutputType::Alloy;
                a
            });

            let combined: OutputsFile = metals.chain(alloys).collect();

            map.insert(key, combined);
        }

        map
    }

    fn load_minerals() -> HashMap<VersionKey, MineralsFile> {
        let mut map = HashMap::new();

        for path in DataAssets::iter() {
            let path_str = path.as_ref();
            if !path_str.ends_with("minerals.json") {
                continue;
            }

            let Some(key) = Self::parse_version_key(path_str) else {
                continue;
            };

            let Some(file) = DataAssets::get(path_str) else {
                continue;
            };

            let raw_data: serde_json::Value = match serde_json::from_slice(&file.data) {
                Ok(v) => v,
                Err(e) => {
                    tracing::warn!(path = path_str, error = %e, "invalid minerals.json, skipping");
                    continue;
                }
            };

            map.insert(key, decode_minerals(raw_data));
        }

        map
    }

    pub fn outputs_for(&self, key: &VersionKey) -> Option<&OutputsFile> {
        self.outputs.get(key)
    }

    pub fn minerals_for(&self, key: &VersionKey) -> Option<&MineralsFile> {
        self.minerals.get(key)
    }

    pub fn output_count(&self) -> usize {
        self.outputs.len()
    }

    pub fn mineral_count(&self) -> usize {
        self.minerals.len()
    }

    pub fn find_version(
        &self,
        version_type: VersionType,
        id: &str,
        version: &str,
    ) -> Option<&BaseGameVersion> {
        let versions: &[BaseGameVersion] = match version_type {
            VersionType::Mod => &self.game_versions.mod_,
            VersionType::Modpack => &self.game_versions.modpack,
        };

        versions
            .iter()
            .filter(|v| v.supported)
            .find(|v| v.id == id && v.version == version)
    }

    fn parse_version_key(path: &str) -> Option<VersionKey> {
        let parts: Vec<&str> = path.split('/').collect();
        if parts.len() < 4 {
            return None;
        }

        let version_type =
            serde_json::from_str::<VersionType>(&format!("\"{}\"", parts[0])).ok()?;

        Some(VersionKey {
            version_type,
            id: parts[1].to_string(),
            version: parts[2].to_string(),
        })
    }
}

fn decode_minerals(raw: serde_json::Value) -> MineralsFile {
    let mut map = HashMap::new();

    let Some(raw_object) = raw.as_object() else {
        return map;
    };

    for (key, val) in raw_object {
        if METADATA_KEYS.contains(&key.as_str()) {
            continue;
        }

        if let Ok(minerals) = serde_json::from_value::<Vec<Mineral>>(val.clone()) {
            map.insert(key.clone(), minerals);
        }
    }

    map
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn game_versions_loads() {
        // Act
        let data = GameData::load();

        // Assert
        assert_eq!(data.game_versions.modpack.len(), 5);
        assert_eq!(data.game_versions.mod_.len(), 1);
        assert_eq!(data.game_versions.schema_version, "1");
    }

    #[test]
    fn outputs_and_minerals_for_all_versions() {
        // Arrange
        let data = GameData::load();

        // Act
        let outputs = data.output_count();
        let minerals = data.mineral_count();

        // Assert
        assert_eq!(outputs, 6);
        assert_eq!(minerals, 6);
    }

    #[test]
    fn find_known_mod_version() {
        // Arrange
        let data = GameData::load();

        // Act
        let version = data.find_version(VersionType::Mod, "terrafirmacraft", "3.2.12");

        // Assert
        let v = version.unwrap();
        assert_eq!(v.display_name, "TerraFirmaCraft");
        assert_eq!(v.constants.get("ingot"), Some(&100));
    }

    #[test]
    fn find_known_modpack_version() {
        // Arrange
        let data = GameData::load();

        // Act
        let version = data.find_version(VersionType::Modpack, "terrafirmagreg", "0.10.6+");

        // Assert
        let v = version.unwrap();
        assert_eq!(v.constants.get("ingot"), Some(&144));
    }

    #[test]
    fn version_not_found_returns_none() {
        // Arrange
        let data = GameData::load();

        // Act
        let version = data.find_version(VersionType::Mod, "nonexistent", "1.0");

        // Assert
        assert!(version.is_none());
    }

    #[test]
    fn outputs_contains_copper() {
        // Arrange
        let data = GameData::load();

        let key = VersionKey {
            version_type: VersionType::Mod,
            id: "terrafirmacraft".into(),
            version: "1.20.1_3.2.12".into(),
        };

        // Act
        let outputs = data.outputs_for(&key).unwrap();

        // Assert
        let copper = outputs.iter().find(|o| o.name == "copper").unwrap();
        assert_eq!(copper.output_type, SmeltingOutputType::Metal);
    }

    #[test]
    fn outputs_contains_brass_alloy() {
        // Arrange
        let data = GameData::load();

        let key = VersionKey {
            version_type: VersionType::Mod,
            id: "terrafirmacraft".into(),
            version: "1.20.1_3.2.12".into(),
        };

        // Act
        let outputs = data.outputs_for(&key).unwrap();

        // Assert
        let brass = outputs.iter().find(|o| o.name == "brass").unwrap();
        assert_eq!(brass.output_type, SmeltingOutputType::Alloy);
        assert_eq!(brass.components.len(), 2);
        assert_eq!(brass.components[0].mineral, "copper");
    }

    #[test]
    fn minerals_for_copper() {
        // Arrange
        let data = GameData::load();

        let key = VersionKey {
            version_type: VersionType::Mod,
            id: "terrafirmacraft".into(),
            version: "1.20.1_3.2.12".into(),
        };

        // Act
        let minerals = data.minerals_for(&key).unwrap();

        // Assert
        let copper_minerals = minerals.get("copper").unwrap();
        assert!(!copper_minerals.is_empty());
        assert_eq!(copper_minerals[0].name, "Small Native Copper");
    }
}
