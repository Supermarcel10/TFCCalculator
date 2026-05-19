fn main() {
    tracing_subscriber::fmt::init();

    let data = tfcc_data::GameData::load();

    let version_count = data.game_versions.modpack.len() + data.game_versions.mod_.len();
    println!("Game versions: {version_count}");
    println!("Output files: {}", data.output_count());
    println!("Mineral files: {}", data.mineral_count());
}
