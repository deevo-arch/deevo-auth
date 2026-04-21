class DeevoAuthError(Exception):
    """Custom exception for Deevo Auth API errors."""

    def __init__(self, message: str, code: str = "unknown", status_code: int = 0):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code

    def __str__(self):
        return f"DeevoAuthError({self.code}, {self.status_code}): {self.message}"
