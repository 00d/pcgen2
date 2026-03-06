plugins {
    kotlin("jvm")
    kotlin("plugin.serialization")
    application
}

kotlin {
    jvmToolchain(21)
}

dependencies {
    implementation(project(":data"))
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.8.1")
}

application {
    mainClass.set("pcgen2.pipeline.IngestKt")
}

tasks.register<JavaExec>("ingest") {
    group = "pcgen2"
    description = "Ingest Foundry pf2e JSON → pcgen2 packs"
    classpath = sourceSets["main"].runtimeClasspath
    mainClass.set("pcgen2.pipeline.IngestKt")
    args(
        System.getProperty("foundry.path", "/tmp/foundry-pf2e/packs/pf2e"),
        project(":data").projectDir.resolve("src/main/resources/pcgen2/packs").absolutePath,
    )
}
