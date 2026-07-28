import unittest
from unittest.mock import patch

import backend.app as app_module


class ServerEntrypointTests(unittest.TestCase):
    def test_main_invokes_uvicorn(self):
        with patch("backend.app.uvicorn.run") as run_mock:
            app_module.main()

        run_mock.assert_called_once_with(app_module.app, host="127.0.0.1", port=8000, reload=False)


if __name__ == "__main__":
    unittest.main()
