
export default async function handler(req, res) {
  const NEWS_API_KEY = process.env.NEWS_API_KEY;
  
  try {
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?category=technology&language=en&pageSize=15&apiKey=${NEWS_API_KEY}`
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch news');
    }

    // Extract just the titles for the ticker
    const titles = data.articles.map(article => article.title);
    
    // Cache for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300');
    return res.status(200).json({ titles });
  } catch (error) {
    console.error('Ticker error:', error);
    return res.status(500).json({ error: 'Failed to fetch live signals' });
  }
}
