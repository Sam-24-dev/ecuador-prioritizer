import math
from dataclasses import dataclass
from typing import Literal, Protocol

PreliminaryClass = Literal["Falso", "Verdadero"]


class InferenceError(Exception):
    """Base exception for all safe inference failures."""


class InferenceInputError(InferenceError):
    pass


class InferenceUnavailableError(InferenceError):
    pass


class InferenceInvalidResultError(InferenceError):
    pass


@dataclass(frozen=True)
class InferenceResult:
    preliminary_class: PreliminaryClass
    p_true: float
    score_false: float

    def __post_init__(self) -> None:
        if self.preliminary_class not in ("Falso", "Verdadero"):
            raise InferenceInvalidResultError("Invalid preliminary_class.")
        for value in (self.p_true, self.score_false):
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not 0 <= value <= 1:
                raise InferenceInvalidResultError("Invalid inference score.")
        if abs(self.score_false - (1 - self.p_true)) > 0.001:
            raise InferenceInvalidResultError("Inconsistent inference scores.")


class InferenceService(Protocol):
    def analyze(self, text: str) -> InferenceResult: ...
