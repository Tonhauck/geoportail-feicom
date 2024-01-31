/* eslint-disable no-undef */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable @typescript-eslint/ban-ts-comment */
// utilitaires.js
// @ts-ignore
export function uniqueValues(tableau, attribut) {
    // Utilisez filter pour éliminer les valeurs null
    const filteredArray = tableau.filter(objet => objet[attribut] !== null);

    // Créez un Set avec les valeurs uniques
    const valeursUniques = new Set(filteredArray.map(objet => objet[attribut]));

    // Créez un tableau de résultats avec la propriété "checked" initialisée à false pour chaque élément
    const result = Array.from(valeursUniques).map(valeur => ({
        'key': valeur,
        checked: false
    }));

    // Triez les clés par ordre ascendant
    result.sort((a, b) => a.key.localeCompare(b.key));

    return result;
}


export function uniqueValuesInArrayOfObject(tableau, attribut) {
    // @ts-ignore
    const valeursUniques = new Set(tableau.map(objet => objet[attribut]));
    return Array.from(valeursUniques);
}

// Function to get statistics
// @ts-ignore
export function getSumOf(data, key) {
    const statistics = {};
    // @ts-ignore
    data.forEach(item => {
        const value = item[key];
        if (value) {
            // @ts-ignore
            if (statistics[value]) {
                // @ts-ignore
                statistics[value]++;
            } else {
                // @ts-ignore
                statistics[value] = 1;
            }
        }
    });

    // Convert the statistics object to an array of objects with the specified structure
    const result = Object.entries(statistics).map(([key, value]) => ({
        ['Région']: key,
        value
    }));

    return result;
}

export function getSumPerYear(data, startYear, endYear, scale) {
    const statistics = {};

    data.forEach(item => {
        const region = item[scale];
        const itemYear = parseInt(item['Année financement']);

        // Vérifier si l'année se trouve dans la plage spécifiée
        if (!isNaN(itemYear) && itemYear >= startYear && itemYear <= endYear) {
            if (statistics[region]) {
                statistics[region]++;
            } else {
                statistics[region] = 1;
            }
        }
    });

    // Convertir l'objet de statistiques en un tableau d'objets avec la structure spécifiée
    const result = Object.entries(statistics).map(([region, count]) => ({
        [scale]: region,
        'value': count
    }));

    return result;
}

export function calculateTotalByRegion(data, startYear, endYear, scale, filters) {
    if (!data || data.length === 0) {
        return []; // Si data est vide, retourne un tableau vide
    }

    const areFiltersEmpty = filters.every(filter => filter.data.length === 0);

    // Si tous les filtres sont vides, calculer la somme entre les deux dates sans filtre
    if (areFiltersEmpty) {
        const totalByRegion = {};

        for (const entry of data) {
            const region = entry[scale];
            const totalString = (typeof entry.TOTAL === 'string' ? entry.TOTAL : '').replace(/,/g, '.').replace(/\D+/g, '');
            const total = parseFloat(totalString);
            const year = parseInt(entry.ANNEE);

            if (!isNaN(total) && year >= startYear && year <= endYear) {
                if (!totalByRegion[region]) {
                    totalByRegion[region] = total;
                } else {
                    totalByRegion[region] += total;
                }

            }
        }

        const result = Object.entries(totalByRegion).map(([key, value]) => ({
            [scale]: key,
            'value': value
        }));

        return result;
    }

    // Sinon, appliquer les filtres spécifiés
    const filteredData = data.filter(entry => {
        return filters.every(filter => {
            const filterKey = filter.indicateur;
            const filterValues = filter.data;
            const entryValue = entry[filterKey];
            return (!filterKey || entryValue === undefined || filterValues.includes(entryValue));
        });
    });

    // Calculer la somme des valeurs filtrées par région et entre les deux dates
    const totalByRegion = {};

    for (const entry of filteredData) {
        const region = entry[scale];
        const totalString = typeof entry.TOTAL === 'string' ? entry.TOTAL.replace(/\D+/g, '') : '0'; // Supprimer les caractères non numériques
        const total = parseFloat(totalString);
        const year = parseInt(entry.ANNEE);

        if (!isNaN(total) && year >= startYear && year <= endYear) {
            if (!totalByRegion[region]) {
                totalByRegion[region] = total;
            } else {
                totalByRegion[region] += total;
            }
        }
    }

    const result = Object.entries(totalByRegion).map(([key, value]) => ({
        [scale]: key,
        'value': value
    }));

    return result;
}



// @ts-ignore
export function findMinMax(array, key) {
    if (!array || array.length === 0) {
        return 0;
    }

    let min = array[0][key];
    let max = array[0][key];

    for (let i = 1; i < array.length; i++) {
        const value = array[i][key];

        if (value < min) {
            min = value;
        }

        if (value > max) {
            max = value;
        }
    }

    return { min, max };
}

export function sumISPValues(data, region, id_level) {
    const averages = {};

    for (const entry of data) {
        if (entry[id_level] === region) {
            const year = entry.ANNEE;
            const total = parseFloat(typeof entry.TOTAL === 'string' ? entry.TOTAL.replace(/\D+/g, '') : '0');

            if (!isNaN(total)) {
                if (!averages[year]) {
                    averages[year] = [];
                }

                averages[year].push(total);
            }
        }
    }

    return {
        data: Object.values(averages).map(yearData => yearData.reduce((acc, value) => acc + value, 0) / yearData.length),
        label: Object.keys(averages).map(Number),
    };
}

export function transformDataForBarChart(data, region, startYear, endYear, id_level) {
    // Filtrer les données pour la région et la plage d'années spécifiées
    const filteredData = data.filter((entry) => entry[id_level] === region && parseInt(entry.ANNEE) >= startYear && parseInt(entry.ANNEE) <= endYear);

    if (filteredData.length === 0) {
        // Aucune donnée correspondante trouvée
        return [];
    }

    // Créer un tableau d'objets pour chaque valeur ISP
    const chartData = [];
    for (let i = 1; i <= 4; i++) {
        const ispValues = filteredData.map((entry) => {
            const ispValue = entry[`ISP${i}`];

            if (typeof ispValue === 'string') {
                const cleanedValue = ispValue.replace(/,/g, '.').replace(/\s+/g, '');
                const floatValue = parseFloat(cleanedValue);

                return !isNaN(floatValue) ? floatValue : 0;
            } else if (typeof ispValue === 'number') {
                return ispValue;
            } else {
                return 0;
            }
        });


        const ispValueSum = ispValues.reduce((acc, val) => acc + val, 0);


        chartData.push({ x: `ISP${i}`, y: ispValueSum });

    }

    return chartData;
}








export function findAllObjectsByAttribute(array, nom_attribut, id) {
    return array.filter(obj => obj[nom_attribut] === id);
}


export function formattedValue(value) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function rechercheMulticriteres(dataForMap, critères) {
    if (critères.length === 0) {
        // Si le tableau de critères est vide, retournez simplement l'array original
        return dataForMap;
    }

    // Utilisez la méthode filter pour filtrer les objets en utilisant les critères spécifiés
    return dataForMap.filter(objet => {
        return critères.every(critère => {
            const champ = critère.indicateur;
            const valeurs = critère.data;

            if (valeurs.length === 0) {
                return true; // Si aucune valeur n'est spécifiée, passez à la prochaine condition
            }

            return valeurs.includes(objet[champ]);
        });
    });
}


export function rechercheMulticriteresPourFEICOM(dataForMap, id_couche, scale, startYear, endYear, dataAllIndicateur) {
    return dataForMap.filter(objet => {
        const champDepartement = scale;
        const champAnnee = "Année financement";

        // Vérifiez si le nom du département correspond
        const correspondNomDepartement = objet[champDepartement] === id_couche;

        // Vérifiez si l'année correspond à la période spécifiée
        const correspondAnnee = parseInt(objet[champAnnee]) >= startYear && parseInt(objet[champAnnee]) <= endYear;

        // Vérifiez les critères de l'array dataAllIndicateur
        const critereIndicateur = dataAllIndicateur.every(indicateur => {
            const champIndicateur = indicateur.indicateur;
            const valeursIndicateur = indicateur.data;

            if (valeursIndicateur.length === 0) {
                return true; // Aucun critère à vérifier, donc l'objet est toujours inclus
            }

            // Vérifiez si l'objet a la propriété correspondant à l'indicateur
            if (!objet.hasOwnProperty(champIndicateur)) {
                return false;
            }

            // Vérifiez si la valeur de l'objet correspond à l'une des valeurs de l'indicateur
            return valeursIndicateur.includes(objet[champIndicateur]);
        });

        // Retournez true si tous les critères correspondent
        return correspondNomDepartement && correspondAnnee && critereIndicateur;
    });
}

export function jsonToItem(data, title) {
    data = data[title].map((objet) => objet.key);
    return data
}





export function optionForBarChart(dataForBarChart, region) {
    let optionsForChart = {
        colors: ['#1A56DB'],
        series: [{
            name: region,
            color: '#1A56DB',
            data: dataForBarChart
        }],
        chart: {
            type: 'bar',
            height: 'auto',
            fontFamily: 'Inter, sans-serif',
            toolbar: {
                show: false
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '70%',
                borderRadiusApplication: 'end',
                borderRadius: 8
            }
        },

        tooltip: {
            shared: true,
            intersect: false,
            style: {
                fontFamily: 'Inter, sans-serif'
            },
            custom: function({ series, seriesIndex, dataPointIndex }) {
                const formatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' });
                const formattedValue = formatter.format(series[seriesIndex][dataPointIndex]);
                return `<div class="text-center p-2">${formattedValue}</div>`;
            }

        },
        states: {
            hover: {
                filter: {
                    type: 'darken',
                    value: 1
                }
            }
        },
        stroke: {
            show: true,
            width: 0,
            colors: ['transparent']
        },
        grid: {
            show: false,
            strokeDashArray: 4,
            padding: {
                left: 2,
                right: 2,
                top: -14
            }
        },
        dataLabels: {
            enabled: false
        },
        legend: {
            show: false
        },
        xaxis: {
            floating: false,
            labels: {
                show: true,
                style: {
                    fontFamily: 'Inter, sans-serif',
                    cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
                }
            },
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false
            }
        },
        yaxis: {
            show: false
        },
        fill: {
            opacity: 1
        }
    };

    return optionsForChart;
}


export function optionForLineChart(label, data, geo) {

    let optionsForChartLine = {
        chart: {
            height: 'auto',
            maxWidth: '100%',
            type: 'area',
            fontFamily: 'Inter, sans-serif',
            dropShadow: {
                enabled: false
            },
            toolbar: {
                show: false
            }
        },
        tooltip: {
            enabled: true,
            x: {
                show: false
            },
            custom: function({ series, seriesIndex, dataPointIndex }) {
                const formatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' });
                const formattedValue = formatter.format(series[seriesIndex][dataPointIndex]);
                return `<div class="text-center p-2">${formattedValue}</div>`;
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                opacityFrom: 0.55,
                opacityTo: 0,
                shade: '#1C64F2',
                gradientToColors: ['#1C64F2']
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            width: 6
        },
        grid: {
            show: false,
            strokeDashArray: 0,
            padding: {
                left: 20,
                right: 10,
                top: 0,
                bottom: 0
            }
        },
        series: [{
            name: geo,
            data: data,
            color: '#1A56DB'
        }],
        xaxis: {
            categories: label,
            labels: {
                show: true,
                maxWidth: 1, // Spécifiez la largeur maximale pour les étiquettes de l'axe des Y
            },

            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false
            }
        },
        yaxis: {
            show: false
        }
    };
    return optionsForChartLine;
}