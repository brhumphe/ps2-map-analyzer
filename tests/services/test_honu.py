import json

from services.honu.models.metagame import MetaGameState


def test_parse_metagame():
    with open("data/honu-metagame.json") as f:
        data = json.load(f)

    # Just going to make sure it parses without error, don't need to do more
    state = MetaGameState.from_json_list(data)
    assert len(state.worlds) == 9
