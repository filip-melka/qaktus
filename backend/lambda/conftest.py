import pytest
import generate_link
import redirect


@pytest.fixture(autouse=True)
def reset_table():
    generate_link._table = None
    redirect._table = None
    yield
    generate_link._table = None
    redirect._table = None
