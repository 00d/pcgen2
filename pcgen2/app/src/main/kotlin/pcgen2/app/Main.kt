package pcgen2.app

import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application

fun main() = application {
    Window(onCloseRequest = ::exitApplication, title = "PCGen2") {
        MaterialTheme {
            Text("PCGen2 — PF2 Remastered Character Builder (M2+ UI)")
        }
    }
}
