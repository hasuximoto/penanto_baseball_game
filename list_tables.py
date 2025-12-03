import xml.etree.ElementTree as ET

ns = {
    'office': 'urn:oasis:names:tc:opendocument:xmlns:office:1.0',
    'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
    'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'
}

def list_tables():
    print("Listing tables...")
    try:
        context = ET.iterparse('unit_xml/CellBall.xml', events=('start',))
        for event, elem in context:
            if event == 'start' and elem.tag == f"{{{ns['table']}}}table":
                name = elem.get(f"{{{ns['table']}}}name")
                print(f"Table: {name}")
    except Exception as e:
        print(e)

if __name__ == "__main__":
    list_tables()
