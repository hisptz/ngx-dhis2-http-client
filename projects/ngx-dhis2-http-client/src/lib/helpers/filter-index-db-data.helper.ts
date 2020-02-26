export function filterIndexDBData(data, filterParams: string[]) {
    if (!filterParams) {
        return data;
    }
    const filterList = filterParams.map((filterString: string) => {
        const splitedFilterString = filterString.split(':');
        return {
            attribute: splitedFilterString[0],
            condition: splitedFilterString[1],
            filterValue: splitedFilterString[2],
        };
    });

    return data.filter((dataItem: any) => filterDataItem(dataItem, filterList));
}

function filterDataItem(dataItem: any, filterList: any[]) {
    return (filterList || []).some((filterItem: any) => {
        const { attribute, condition, filterValue } = filterItem;
        switch (condition) {
            case 'ilike': {
                return (dataItem[attribute] || '').indexOf(filterValue) !== -1;
            }

            case 'eq': {
                return dataItem[attribute] === filterValue;
            }

            case 'le': {
                return (
                    parseInt(dataItem[attribute], 10) <=
                    parseInt(filterValue, 10)
                );
            }

            case 'lt': {
                return (
                    parseInt(dataItem[attribute], 10) <
                    parseInt(filterValue, 10)
                );
            }

            case 'ge': {
                return (
                    parseInt(dataItem[attribute], 10) >=
                    parseInt(filterValue, 10)
                );
            }

            case 'gt': {
                return (
                    parseInt(dataItem[attribute], 10) >
                    parseInt(filterValue, 10)
                );
            }

            case 'in': {
                return (filterValue || '').indexOf(dataItem[attribute]) !== -1;
            }
            default:
                return false;
        }
    });
}
