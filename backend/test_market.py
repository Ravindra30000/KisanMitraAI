import asyncio
import sys
import os
sys.path.insert(0, '.')

from dotenv import load_dotenv
load_dotenv(override=True)

from app.services.market import fetch_market_data

async def test():
    result = await fetch_market_data('Madhya Pradesh', 'Bhopal', 'hi')
    print('Source:', result.get('source'))
    print('Prices count:', len(result.get('prices', [])))
    print('First 3 entries:')
    for p in result['prices'][:3]:
        comm = p['commodityId']
        price = p['price']
        change = p['change']
        mandi = p['mandi']
        print(f'  [{comm}] Rs.{price}/qtl  change={change}  mandi={mandi.encode("ascii","replace").decode()}')
    advisory = result['advisory']
    # encode safely for Windows console
    print('Advisory preview:', advisory[:120].encode('ascii', errors='replace').decode())

asyncio.run(test())
