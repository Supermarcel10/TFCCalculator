use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub enum SmeltingOutputType {
    #[default]
    Metal,
    Alloy,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SmeltingComponent {
    pub mineral: String,
    pub min: f64,
    pub max: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SmeltingOutput {
    pub name: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub components: Vec<SmeltingComponent>,
    #[serde(default = "default_true")]
    pub producible: bool,
    #[serde(rename = "type", default)]
    pub output_type: SmeltingOutputType,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub default: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MineralUseCase {
    Vessel,
    Crucible,
    Bloomery,
    BlastFurnace,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Mineral {
    pub name: String,
    #[serde(default)]
    pub produces: String,
    #[serde(rename = "yield")]
    pub yield_mb: u32,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub uses: Option<Vec<MineralUseCase>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct QuantifiedMineral {
    pub mineral: Mineral,
    pub quantity: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum DesiredOutputTypes {
    Ingot,
    Nugget,
    Millibucket,
}

fn default_true() -> bool {
    true
}

#[cfg(test)]
mod tests {
    use super::*;
    use rstest::rstest;

    #[test]
    fn deserialize_metal_output() {
        // Arrange
        let json = r#"{"name": "copper"}"#;

        // Act
        let output: SmeltingOutput = serde_json::from_str(json).unwrap();

        // Assert
        assert_eq!(output.name, "copper");
        assert_eq!(output.output_type, SmeltingOutputType::Metal);
        assert!(output.components.is_empty());
        assert!(output.producible);
    }

    #[test]
    fn deserialize_alloy_output() {
        // Arrange
        let json = r#"{
            "name": "brass",
            "components": [
                {"mineral": "copper", "min": 88.0, "max": 92.0},
                {"mineral": "zinc", "min": 8.0, "max": 12.0}
            ]
        }"#;

        // Act
        let output: SmeltingOutput = serde_json::from_str(json).unwrap();

        // Assert
        assert_eq!(output.name, "brass");
        assert_eq!(output.components.len(), 2);
        assert_eq!(output.components[0].min, 88.0);
    }

    #[test]
    fn deserialize_mineral() {
        // Arrange
        let json = r#"{
            "name": "Native Copper",
            "yield": 144,
            "uses": ["crucible"]
        }"#;

        // Act
        let mineral: Mineral = serde_json::from_str(json).unwrap();

        // Assert
        assert_eq!(mineral.name, "Native Copper");
        assert_eq!(mineral.yield_mb, 144);
        assert_eq!(mineral.uses, Some(vec![MineralUseCase::Crucible]));
    }

    #[rstest]
    #[case(r#""metal""#, SmeltingOutputType::Metal)]
    #[case(r#""alloy""#, SmeltingOutputType::Alloy)]
    fn deserialize_smelting_output_type(#[case] json: &str, #[case] expected: SmeltingOutputType) {
        // Act
        let parsed = serde_json::from_str::<SmeltingOutputType>(json).unwrap();

        // Assert
        assert_eq!(parsed, expected);
    }

    #[rstest]
    #[case("\"vessel\"", MineralUseCase::Vessel)]
    #[case("\"crucible\"", MineralUseCase::Crucible)]
    #[case("\"bloomery\"", MineralUseCase::Bloomery)]
    #[case("\"blast_furnace\"", MineralUseCase::BlastFurnace)]
    fn deserialize_mineral_use_case(#[case] json: &str, #[case] expected: MineralUseCase) {
        // Act
        let parsed = serde_json::from_str::<MineralUseCase>(json).unwrap();

        // Assert
        assert_eq!(parsed, expected);
    }

    #[rstest]
    #[case(r#""ingot""#, DesiredOutputTypes::Ingot)]
    #[case(r#""nugget""#, DesiredOutputTypes::Nugget)]
    fn deserialize_desired_output_types(#[case] json: &str, #[case] expected: DesiredOutputTypes) {
        // Act
        let parsed = serde_json::from_str::<DesiredOutputTypes>(json).unwrap();

        // Assert
        assert_eq!(parsed, expected);
    }

    #[test]
    fn quantified_mineral_serde_roundtrip() {
        // Arrange
        let qm = QuantifiedMineral {
            mineral: Mineral {
                name: "Native Copper".into(),
                produces: "copper".into(),
                yield_mb: 144,
                uses: Some(vec![MineralUseCase::Crucible]),
            },
            quantity: 3,
        };

        // Act
        let json = serde_json::to_string(&qm).unwrap();
        let parsed: QuantifiedMineral = serde_json::from_str(&json).unwrap();

        // Assert
        assert_eq!(parsed.mineral.name, "Native Copper");
        assert_eq!(parsed.mineral.yield_mb, 144);
        assert_eq!(parsed.quantity, 3);
    }
}
