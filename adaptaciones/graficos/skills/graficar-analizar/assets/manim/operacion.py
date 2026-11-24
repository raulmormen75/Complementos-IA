from manim import (
    BLUE_C, DOWN, GREEN_C, UP, WHITE, FadeIn, FadeOut, ReplacementTransform,
    Scene, Text, Write,
)


class OperacionPasoAPaso(Scene):
    def construct(self):
        self.camera.background_color = "#11253c"
        title = Text("Conserva la igualdad", font_size=42, color=WHITE)
        title.to_edge(UP)
        steps = (
            ("2x + 3 = 11", "Buscamos el valor de x."),
            ("2x + 3 − 3 = 11 − 3", "Restamos 3 a ambos lados."),
            ("2x = 8", "Reducimos las expresiones."),
            ("2x ÷ 2 = 8 ÷ 2", "Dividimos ambos lados entre 2."),
            ("x = 4", "Comprobación: 2(4) + 3 = 11."),
        )
        equation = Text(steps[0][0], font_size=55, color=BLUE_C)
        explanation = Text(steps[0][1], font_size=27, color=WHITE).next_to(equation, DOWN, buff=0.85)
        self.play(Write(title), FadeIn(equation), FadeIn(explanation))
        self.wait(1.2)
        for index, (operation, note) in enumerate(steps[1:], start=1):
            color = GREEN_C if index == len(steps) - 1 else BLUE_C
            next_equation = Text(operation, font_size=55, color=color)
            next_explanation = Text(note, font_size=27, color=WHITE).next_to(next_equation, DOWN, buff=0.85)
            self.play(FadeOut(explanation), ReplacementTransform(equation, next_equation))
            self.play(FadeIn(next_explanation))
            self.wait(1.4)
            equation, explanation = next_equation, next_explanation
        self.wait(1)
