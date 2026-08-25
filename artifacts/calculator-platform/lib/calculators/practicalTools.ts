function safe(value:number){return Number.isFinite(value)?Math.max(0,value):0}
export function fuelCost(distance:number,mpg:number,pricePerGallon:number){const d=safe(distance),efficiency=safe(mpg),price=safe(pricePerGallon);const gallons=efficiency>0?d/efficiency:0;return{gallons,cost:gallons*price};}
export function voltageDrop(currentAmps:number,oneWayLengthFeet:number,resistanceOhmsPer1000Feet:number,supplyVoltage:number){const current=safe(currentAmps),length=safe(oneWayLengthFeet),resistance=safe(resistanceOhmsPer1000Feet),supply=safe(supplyVoltage);const drop=current*(2*length/1000)*resistance;return{drop,remainingVoltage:Math.max(0,supply-drop),percent:supply>0?drop/supply*100:0};}
export function heatingBtu(areaSquareFeet:number,temperatureDifferenceF:number,lossFactor:number){return safe(areaSquareFeet)*safe(temperatureDifferenceF)*safe(lossFactor);}
export function squareFootage(lengthFeet:number,widthFeet:number){return safe(lengthFeet)*safe(widthFeet);}
