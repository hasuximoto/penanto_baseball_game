import xml.etree.ElementTree as ET
import sys

ns = {
    'office': 'urn:oasis:names:tc:opendocument:xmlns:office:1.0',
    'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
    'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'
}

def list_sheets():
    print("Listing sheets...", flush=True)
    try:
        context = ET.iterparse('unit_xml/CellBall.xml', events=('start',))
        for event, elem in context:
            if event == 'start' and elem.tag == f"{{{ns['table']}}}table":
                name = elem.get(f"{{{ns['table']}}}name")
                print(f"Sheet found: {name}", flush=True)
            elem.clear()
    except Exception as e:
        print(f"Error: {e}", flush=True)

if __name__ == "__main__":
    list_sheets()
