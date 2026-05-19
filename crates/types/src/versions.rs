use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "camelCase")]
pub enum VersionType {
    Mod,
    Modpack,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct BaseGameVersion {
    pub id: String,
    pub display_name: String,
    pub version: String,
    pub game_version: String,
    pub constants: HashMap<String, u32>,
    pub supported: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GameVersions {
    pub modpack: Vec<BaseGameVersion>,
    #[serde(rename = "mod")]
    pub mod_: Vec<BaseGameVersion>,
    pub last_updated: String,
    pub version: String,
    pub schema_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RouteParams {
    #[serde(rename = "type")]
    pub version_type: String,
    pub id: String,
    pub version: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use rstest::rstest;

    #[test]
    fn deserialize_game_versions() {
        // Arrange
        let json = include_str!("../tests/fixtures/gameversions.json");

        // Act
        let gv: GameVersions = serde_json::from_str(json).unwrap();

        // Assert
        assert_eq!(gv.modpack.len(), 5);
        assert_eq!(gv.mod_.len(), 1);
        assert_eq!(gv.schema_version, "1");

        let tfc_mod = &gv.mod_[0];
        assert_eq!(tfc_mod.id, "terrafirmacraft");
        assert_eq!(tfc_mod.constants.get("ingot"), Some(&100));
    }

    #[rstest]
    #[case("\"mod\"", VersionType::Mod)]
    #[case("\"modpack\"", VersionType::Modpack)]
    fn deserialize_version_type(#[case] json: &str, #[case] expected: VersionType) {
        // Act
        let parsed = serde_json::from_str::<VersionType>(json).unwrap();

        // Assert
        assert_eq!(parsed, expected);
    }
}
