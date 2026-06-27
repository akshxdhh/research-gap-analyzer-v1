import os
import sys
import importlib

sys.path.append(os.path.abspath("."))

def try_import(module_name):
    try:
        importlib.import_module(module_name)
        return True, None
    except Exception as e:
        return False, str(e)

if __name__ == "__main__":
    modules_to_test = [
        "main",
        "database",
        "config",
        "dependencies",
        "routers.upload",
        "routers.analyze",
        "routers.reports",
        "routers.status",
        "routers.projects",
        "routers.papers",
        "routers.gaps",
        "modules.llm_layer",
        "modules.planner",
        "modules.local_rag",
        "modules.paper_search",
        "modules.web_search",
        "modules.context_merger",
        "modules.research_analyzer",
        "modules.report_exporter"
    ]
    
    for mod in modules_to_test:
        success, err = try_import(mod)
        if success:
            print(f"SUCCESS: {mod}")
        else:
            print(f"FAILED: {mod} -> {err}")
