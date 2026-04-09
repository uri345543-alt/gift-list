import aiohttp
from bs4 import BeautifulSoup
from typing import Optional, Dict

async def get_link_preview(url: str) -> Dict[str, Optional[str]]:
    if not url:
        return {"title": None, "image": None, "description": None}
    
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=5, headers={'User-Agent': 'Mozilla/5.0'}) as response:
                if response.status != 200:
                    return {"title": None, "image": None, "description": None}
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Try Open Graph tags first
                title = soup.find("meta", property="og:title")
                image = soup.find("meta", property="og:image")
                description = soup.find("meta", property="og:description")
                
                res = {
                    "title": title["content"] if title else soup.title.string if soup.title else None,
                    "image": image["content"] if image else None,
                    "description": description["content"] if description else None
                }
                
                # Fallback for description if og:description is missing
                if not res["description"]:
                    desc_tag = soup.find("meta", attrs={"name": "description"})
                    if desc_tag:
                        res["description"] = desc_tag.get("content")

                # Clean up title
                if res["title"]:
                    res["title"] = res["title"].strip()
                
                return res
    except Exception as e:
        print(f"Error fetching preview for {url}: {e}")
        return {"title": None, "image": None, "description": None}
