use serde::{Deserialize, Serialize};

use crate::smelting::QuantifiedMineral;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ResolutionStrategy {
    ExactMatch,
    ClosestAlternative { interval_mb: u32 },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum CalculationStatus {
    Success,
    BadRequest,
    InsufficientTotalMb,
    InsufficientSpecificMineralMb { mineral: String },
    Unfeasible,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CalculationOutput {
    pub status: CalculationStatus,
    pub amount_mb: u32,
    pub used_minerals: Vec<QuantifiedMineral>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolution_strategy_serde_exact_match() {
        // Arrange
        let json = r#"{"type":"EXACT_MATCH"}"#;

        // Act
        let strategy: ResolutionStrategy = serde_json::from_str(json).unwrap();
        let serialized = serde_json::to_string(&strategy).unwrap();

        // Assert
        assert_eq!(strategy, ResolutionStrategy::ExactMatch);
        assert!(serialized.contains("EXACT_MATCH"));
    }

    #[test]
    fn resolution_strategy_serde_closest_alternative() {
        // Arrange
        let json = r#"{"type":"CLOSEST_ALTERNATIVE","interval_mb":144}"#;

        // Act
        let strategy: ResolutionStrategy = serde_json::from_str(json).unwrap();
        let serialized = serde_json::to_string(&strategy).unwrap();

        // Assert
        assert_eq!(
            strategy,
            ResolutionStrategy::ClosestAlternative { interval_mb: 144 }
        );
        assert!(serialized.contains(r#""interval_mb":144"#));
    }

    #[test]
    fn resolution_strategy_missing_fields_fails() {
        // Arrange
        let json = r#"{"type":"CLOSEST_ALTERNATIVE"}"#;

        // Act
        let result = serde_json::from_str::<ResolutionStrategy>(json);

        // Assert
        assert!(result.is_err());
    }

    #[test]
    fn calculation_status_serde_success() {
        // Arrange
        let json = r#"{"type":"SUCCESS"}"#;

        // Act
        let status: CalculationStatus = serde_json::from_str(json).unwrap();
        let serialized = serde_json::to_string(&status).unwrap();

        // Assert
        assert_eq!(status, CalculationStatus::Success);
        assert!(serialized.contains("SUCCESS"));
    }

    #[test]
    fn calculation_status_serde_insufficient_mineral() {
        // Arrange
        let json = r#"{"type":"INSUFFICIENT_SPECIFIC_MINERAL_MB","mineral":"copper"}"#;

        // Act
        let status: CalculationStatus = serde_json::from_str(json).unwrap();
        let serialized = serde_json::to_string(&status).unwrap();

        // Assert
        assert_eq!(
            status,
            CalculationStatus::InsufficientSpecificMineralMb {
                mineral: "copper".into()
            }
        );
        assert!(serialized.contains(r#""mineral":"copper""#));
    }

    #[test]
    fn calculation_status_insufficient_mineral_missing_field_fails() {
        // Arrange
        let json = r#"{"type":"INSUFFICIENT_SPECIFIC_MINERAL_MB"}"#;

        // Act
        let result = serde_json::from_str::<CalculationStatus>(json);

        // Assert
        assert!(result.is_err());
    }

    #[test]
    fn calculation_output_serde() {
        // Arrange
        let output = CalculationOutput {
            status: CalculationStatus::Success,
            amount_mb: 400,
            used_minerals: vec![],
        };

        // Act
        let json = serde_json::to_string(&output).unwrap();

        // Assert
        assert!(json.contains(r#""SUCCESS""#));
        assert!(json.contains(r#""amountMb":400"#));
        assert!(!json.contains("statusContext"));
    }
}
