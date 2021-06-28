const {BigQuery} = require('@google-cloud/bigquery')
const axios = require('axios')
const cheerio = require('cheerio')

getPrice =  (priceStr) => {
    let num = Number(priceStr.substring(1).replace(',',''))
    if (num < 0.000001) {
        return 0
    } else {
        return num
    }
}

getPage = async (pageNumber) => {
    return await axios.get(`https://coinmarketcap.com/?page=${pageNumber}`)
        .then(response => {
            return response.data 
    })
}

getCoinsFromHtml = (html, i) => {

    let coins = []

    const $ = cheerio.load(html)

    const coinsTable = $('tr')

    coinsTable.each((order, element) => {
        if (order === 0) {
            // header
            return;
        }

        let coin = {
            rank: order + (i-1) * 100,
            price: getPrice($(element).children().eq(3).text()),
            name: $(element).children().eq(2).text(),
            date: new Date().toISOString().split('T')[0],
        }

        coins.push(coin)
    })

    return coins
}

getAllCoins = async() => {

    let coins = []

    for (let i = 1; i <= 50; i++) {
        let html = await getPage(i)
        let array = getCoinsFromHtml(html,i)
        coins.push(...array)
        console.log(i + 'array size ' + coins.length)
    }

    return coins
}

exports.coinmarketcap = async (req, res) => {

    const bigqueryClient = new BigQuery();

    const rows = await getAllCoins()

    await bigqueryClient
        .dataset('marketcapTest')
        .table('markets')
        .insert(rows);
    console.log(`Inserted ${rows.length} rows`);

    res.send('success');
}
