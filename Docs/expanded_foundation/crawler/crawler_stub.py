from dataclasses import dataclass
from typing import List

@dataclass
class CrawlTask:
    source: str
    resource: str

def build_tasks() -> List[CrawlTask]:
    return [
        CrawlTask(source="portal", resource="tenders"),
        CrawlTask(source="portal", resource="providers"),
        CrawlTask(source="datos_abiertos", resource="ocds_releases"),
    ]

if __name__ == "__main__":
    for task in build_tasks():
        print(f"task: {task.source} -> {task.resource}")
