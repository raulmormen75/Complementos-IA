"""Animación editable de ax + b = c, sin servicios ni plantillas de LaTeX externas."""
from fractions import Fraction
import json
import os

from manim import BLUE_B, DOWN, GOLD_B, LEFT, RIGHT, UP, WHITE, FadeIn, Scene, Text, Transform, VGroup


def terms():
    values = json.loads(os.environ.get("MANIM_EQUATION", '{"a": 2, "b": 3, "c": 9}'))
    a, b, c = (values[key] for key in ("a", "b", "c"))
    if any(type(item) is not int or abs(item) > 999 for item in (a, b, c)) or a == 0:
        raise ValueError("Usa coeficientes enteros entre -999 y 999, con a distinto de cero.")
    return a, b, c


def signed(value):
    return f" + {value}" if value >= 0 else f" − {abs(value)}"


def minus(value):
    return str(value).replace("-", "−")


class EcuacionLineal(Scene):
    def construct(self):
        a, b, c = terms()
        self.camera.background_color = "#111C26"
        factor = "x" if a == 1 else "−x" if a == -1 else f"{minus(a)}x"
        goal = Text("Despejar x", color=GOLD_B, font_size=32).to_edge(UP, buff=0.58)
        current = Text(f"{factor}{signed(b) if b else ''} = {minus(c)}", color=WHITE, font_size=59)
        left = Text("lado izquierdo", color=BLUE_B, font_size=23).shift(LEFT * 3 + DOWN * 1.15)
        right = Text("lado derecho", color=BLUE_B, font_size=23).shift(RIGHT * 3 + DOWN * 1.15)
        action = Text("Conserva la igualdad", color=GOLD_B, font_size=29).to_edge(DOWN, buff=0.64)
        self.play(FadeIn(goal), FadeIn(current), FadeIn(VGroup(left, right)), FadeIn(action), run_time=1.0)

        def step(equation, caption):
            next_value = Text(equation, color=WHITE, font_size=59)
            if next_value.width > 12:
                next_value.scale_to_fit_width(12)
            next_caption = Text(caption, color=GOLD_B, font_size=29).to_edge(DOWN, buff=0.64)
            self.play(Transform(current, next_value), Transform(action, next_caption), run_time=0.75)
            self.wait(0.65)

        total = c - b
        if b:
            step(f"{factor}{signed(b)}{signed(-b)} = {minus(c)}{signed(-b)}",
                 f"{'Resta' if b > 0 else 'Suma'} {abs(b)} en ambos lados")
            step(f"{factor} = {minus(total)}", "Simplifica los dos lados")
        if a != 1:
            step(f"({factor}) ÷ ({minus(a)}) = {minus(total)} ÷ ({minus(a)})",
                 f"Divide ambos lados entre {minus(a)}")
        answer = Fraction(total, a)
        step(f"x = {minus(answer)}", "El valor de x conserva la igualdad")
        self.wait(1.2)
