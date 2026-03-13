class Agent:
    def __init__(self, *args, **kwargs): pass
class Task:
    def __init__(self, *args, **kwargs): pass
class Crew:
    def __init__(self, *args, **kwargs):
        self.agents = kwargs.get('agents', [])
        self.tasks = kwargs.get('tasks', [])
    def kickoff(self, *args, **kwargs) -> str:
        return '{"strategy_name": "Mock Strategy", "explanation": "CrewAI is current mocked due to environment issues."}'
class Process:
    sequential = "sequential"
    hierarchical = "hierarchical"
class LLM:
    def __init__(self, *args, **kwargs): pass
