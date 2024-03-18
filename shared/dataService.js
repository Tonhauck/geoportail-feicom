/* eslint-disable @typescript-eslint/ban-ts-comment */
// dataService.js
import Papa from "papaparse";

export async function fetchData() {

    const feicom =
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vTiCvFI_dzAV6jTiAnRq6ikqaeteoXMtZXjpHyk3MfVSYUt3jocJA38mxfdsSYatw/pub?gid=606824651&single=true&output=tsv";
    const mandat =
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vTiCvFI_dzAV6jTiAnRq6ikqaeteoXMtZXjpHyk3MfVSYUt3jocJA38mxfdsSYatw/pub?gid=647677433&single=true&output=tsv";
    const icsp = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTiCvFI_dzAV6jTiAnRq6ikqaeteoXMtZXjpHyk3MfVSYUt3jocJA38mxfdsSYatw/pub?gid=962052684&single=true&output=tsv";
    const commune = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTiCvFI_dzAV6jTiAnRq6ikqaeteoXMtZXjpHyk3MfVSYUt3jocJA38mxfdsSYatw/pub?gid=961481301&single=true&output=tsv'
    const region = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTiCvFI_dzAV6jTiAnRq6ikqaeteoXMtZXjpHyk3MfVSYUt3jocJA38mxfdsSYatw/pub?gid=583846364&single=true&output=tsv'
    
    const [mandatData, dataArr, icspData, communeData,regionData] = await Promise.all([

        fetchDataFromSheet(mandat),
        fetchDataFromSheet(feicom),
        fetchDataFromSheet(icsp),
        fetchDataFromSheet(commune),
        fetchDataFromSheet(region),

    ]);
    return { mandatData, dataArr, icspData, communeData ,regionData};
}

// @ts-ignore
function fetchDataFromSheet(url) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            delimiter: "	",
            header: true,
            dynamicTyping: true,
            complete: function(results) {
                resolve(results.data);
            },
            error: function(error) {
                reject(error);
            },
        });
    });
}