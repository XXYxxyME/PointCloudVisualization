importScripts("libs/pako.min.js");

class BinLoader {
    constructor() {
    }

    loadFromSelfURL(url, nodeName) {

        Pco.nodes[nodeName].xhr = new XMLHttpRequest();

        let node = Pco.nodes[nodeName];
        node.xhr.open('GET', url, true);
        node.xhr.responseType = 'arraybuffer';

        node.xhr.onreadystatechange = () => {

            if (node.xhr.readyState === 4) {
                if (node.xhr.status === 200 || node.xhr.status === 0) {

                    if (node.xhr.response == null) {
                        return;
                    }

                    this.analyzeSelfBin(node.xhr.response, nodeName);

                } else {
                    console.log('Failed to load file! HTTP status: ' + node.xhr.status + ', file: ' + url);
                }
            }
        };
        node.xhr.send(null);
    }

    analyzeSelfBin(buffer, nodeName){

        let geometry = new THREE.BufferGeometry();
        let view = new Uint8Array(buffer);
        let array = [];//存储xyz
        let colorArray = [];
        let levArray = [];
        let xrray = [];

        let x = 0;
        let num = 0;//计算次方
        let flag = 0;
        for(let i = 0; i < buffer.byteLength;i++){

            let y = view[i];
            if(flag >=3 && flag <= 5){
                colorArray.push(y);
                flag++;
                continue;
            }
            if(flag == 6 ){
                flag++;
                x = x + y * Math.pow(2,num * 8);
                num++;
                continue;
            }
            if(flag == 7){
                x = x + y * Math.pow(2,num * 8);
                x = x * 0.01;
                levArray.push(x);
                x = 0;
                flag = 0;
                num = 0;
                continue;
            }
            if(view[i] >= 128){
                y = y - 128;
                x = x + y * Math.pow(2,num * 7);
                num++;
            }
            else{
                x = x + y * Math.pow(2,num * 7);
                array.push(x);
                flag++;
                num = 0;
                x = 0;
            }

        }

        let numPoints = array.length / 3;
        let colors = new Uint8Array(numPoints * 4);
        //console.log('节点名：', nodeName, '点数：',numPoints);
        for(let i = 0; i < numPoints; i++){

            let x = (array[3 * i] * Pco.scale[0] + Pco.nodes[nodeName].boundingBox.min.x * 10.0)/10.0;
            let y = (array[3 * i + 1] * Pco.scale[1] + Pco.nodes[nodeName].boundingBox.min.y * 10.0)/10.0;
            let z = (array[3 * i + 2] * Pco.scale[2] + Pco.nodes[nodeName].boundingBox.min.z * 10.0)/10.0;

            xrray[3 * i] = x;
            xrray[3 * i + 1] = z;
            xrray[3 * i + 2] = y;

            colors[4 * i + 0] = colorArray[3 * i + 0];
            colors[4 * i + 1] = colorArray[3 * i + 1];
            colors[4 * i + 2] = colorArray[3 * i + 2];
            colors[4 * i + 3] = 255;

        }


        let positionBuffer = new THREE.BufferAttribute(new Float32Array(xrray), 3);
        let levelArray = new THREE.BufferAttribute(new Float32Array(levArray), 1);
        let ca = new THREE.BufferAttribute(colors, 4);

        geometry.addAttribute('position', positionBuffer);
        geometry.addAttribute('level', levelArray);
        geometry.addAttribute('color', ca);

        Pco.nodes[nodeName].geometry = geometry;

    }


    loadFromPotreeURL(url, nodeName) {

        Pco.nodes[nodeName].xhr = new XMLHttpRequest();

        let node = Pco.nodes[nodeName];
        node.xhr.open('GET', url, true);
        node.xhr.responseType = 'arraybuffer';

        node.xhr.onreadystatechange = () => {

            if (node.xhr.readyState === 4) {
                if (node.xhr.status === 200 || node.xhr.status === 0) {

                    if (node.xhr.response == null) {
                        return;
                    }

                    this.analyzePotreeBin(node.xhr.response, nodeName);

                } else {
                    console.log('Failed to load file! HTTP status: ' + node.xhr.status + ', file: ' + url);
                }
            }
        };
        node.xhr.send(null);
    }

    analyzePotreeBin(buffer, nodeName){

        let geometry = new THREE.BufferGeometry();
        let sourceView = new DataView(buffer);
        let numPoints = buffer.byteLength / 16;
        let positions = new Float32Array(numPoints * 3);
        let colors = new Uint8Array(numPoints * 4);
        for (let j = 0; j < numPoints; j++) {
            let x, y, z;
            let r, g, b;
            x = sourceView.getUint32( j * 16 + 0, true) ;
            y = sourceView.getUint32( j * 16 + 4, true) ;
            z = sourceView.getUint32( j * 16 + 8, true) ;

            r = sourceView.getUint8( j * 16 + 12);
            g = sourceView.getUint8( j * 16 + 13);
            b = sourceView.getUint8( j * 16 + 14);

            positions[3 * j + 0] = x * Pco.scale + Pco.nodes[nodeName].boundingBox.min.x;
            positions[3 * j + 1] = z * Pco.scale + Pco.nodes[nodeName].boundingBox.min.z;
            positions[3 * j + 2] = y * Pco.scale + Pco.nodes[nodeName].boundingBox.min.y;

            colors[4 * j + 0] = r;
            colors[4 * j + 1] = g;
            colors[4 * j + 2] = b;
            colors[4 * j + 3] = 255;

        }

        var levels = new Float32Array(numPoints);
        for (let i = 0; i < numPoints; i++) {
            levels[i] = Math.random() + Pco.nodes[nodeName].level;
        }
        let positionArray = new THREE.BufferAttribute(positions, 3);
        let levelArray = new THREE.BufferAttribute(levels, 1);
        let colorArray = new THREE.BufferAttribute(colors, 4);
        geometry.addAttribute('position', positionArray);
        geometry.addAttribute('color', colorArray);
        geometry.addAttribute('level', levelArray);

        Pco.nodes[nodeName].geometry = geometry;

    }
}

function getTheLevelClod(maxLevel, level, tightBoxX, tightBoxY, tightBoxZ) {

    let dimension;
    let max = Math.max(tightBoxX, Math.max(tightBoxY, tightBoxZ));
    let min = Math.min(tightBoxX, Math.min(tightBoxY, tightBoxZ));
    if(max - min > 10){
        dimension = 2;
    }
    else{
        dimension = 3;
    }
    let x1 = (Math.exp(level * dimension * Math.log(2)) - 1)/(Math.pow(2,dimension * maxLevel + dimension) - 1);
    let x2 = (Math.exp((level + 1) * dimension * Math.log(2)) - 1)/(Math.pow(2,dimension * maxLevel + dimension) - 1);
    let random = Math.random() * (x2 - x1) + x1;
    //random = Math.random();
    let clod =  Math.log((Math.pow(2,dimension * maxLevel + dimension) - 1) * random + 1)/(dimension * Math.log(2));

    return clod;

}

function analyzebuffer(buffer, nodeName){

    let geometry = new THREE.BufferGeometry();
    let view = new Uint8Array(buffer);
    let array = [];//存储xyz
    let colorArray = [];
    let levArray = [];
    let xrray = [];

    let x = 0;
    let num = 0;//计算次方
    let flag = 0;
    for(let i = 0; i < buffer.byteLength;i++){

        let y = view[i];
        if(flag >=3 && flag <= 5){
            colorArray.push(y);
            flag++;

            if(flag == 6){

                x = 0;
                flag = 0;
                num = 0;
            }
            continue;
        }
        /*
                if(flag == 6 ){
                    flag++;
                    x = x + y * Math.pow(2,num * 8);
                    num++;
                    continue;
                }
                if(flag == 7){
                    x = x + y * Math.pow(2,num * 8);
                    x = x * 0.01;
                    levArray.push(x);
                    x = 0;
                    flag = 0;
                    num = 0;
                    continue;
                }
        */
        if(view[i] >= 128){
            y = y - 128;
            x = x + y * Math.pow(2,num * 7);
            num++;
        }
        else{
            x = x + y * Math.pow(2,num * 7);
            array.push(x);
            flag++;
            num = 0;
            x = 0;
        }

    }

    let numPoints = array.length / 3;
    let colors = new Uint8Array(numPoints * 4);
    //console.log('节点名：', nodeName, '点数：',numPoints);

    for(let i = 0; i < numPoints; i++){

        let clod =  getTheLevelClod(9, Pco.nodes[nodeName].level);
        levArray.push(clod);
        let x = (array[3 * i] * Pco.scale[0] + Pco.nodes[nodeName].boundingBox.min.x * 10.0)/10.0;
        let y = (array[3 * i + 1] * Pco.scale[1] + Pco.nodes[nodeName].boundingBox.min.y * 10.0)/10.0;
        let z = (array[3 * i + 2] * Pco.scale[2] + Pco.nodes[nodeName].boundingBox.min.z * 10.0)/10.0;

        xrray[3 * i] = x;
        xrray[3 * i + 1] = z;
        xrray[3 * i + 2] = y;

        colors[4 * i + 0] = colorArray[3 * i + 0];
        colors[4 * i + 1] = colorArray[3 * i + 1];
        colors[4 * i + 2] = colorArray[3 * i + 2];
        colors[4 * i + 3] = 255;

    }
    let positionBuffer = new THREE.BufferAttribute(new Float32Array(xrray), 3);
    let levelArray = new THREE.BufferAttribute(new Float32Array(levArray), 1);
    let ca = new THREE.BufferAttribute(colors, 4);

    geometry.addAttribute('position', positionBuffer);
    geometry.addAttribute('level', levelArray);
    geometry.addAttribute('color', ca);

    return geometry;
}


onmessage = function (message){

    let name = message.data.nodeName;
    let dataNameLen = message.data.dataNameLen;
    let buffer = message.data.buffer;
    buffer = pako.ungzip(buffer.slice(dataNameLen + 2,buffer.byteLength));
    let level = message.data.level;
    let boxX = message.data.boxX;
    let boxY = message.data.boxY;
    let boxZ = message.data.boxZ;
    let scale = message.data.scale;
    let tightBoxX = message.data.tightBoxX;
    let tightBoxY = message.data.tightBoxY;
    let tightBoxZ = message.data.tightBoxZ;

    let view = new Uint8Array(buffer);

    let colorArray = [];
    let levelArray = [];
    let positionArray = [];

    let x = 0;
    let num = 0;//计算次方
    let flag = 0;

    for(let i = 0; i < buffer.byteLength;i++){

        let y = view[i];
        if(flag >=3 && flag <= 5){

            colorArray.push(y);
            flag++;

            if(flag === 6){

                x = 0;
                flag = 0;
                num = 0;
            }
            continue;
        }

        if(view[i] >= 128){
            y = y - 128;
            x = x + y * Math.pow(2,num * 7);
            num++;
        }
        else{
            x = x + y * Math.pow(2,num * 7);
            switch(flag){
                case 0:
                    x = x * scale + boxX;
                    break;
                case 1:
                    x = x * scale + boxY;
                    break;
                case 2:
                    x = x * scale + boxZ;
                    let clod =  getTheLevelClod(9, level, tightBoxX, tightBoxY, tightBoxZ);
                    levelArray.push(clod);
                    break;
                default:
                    break;
            }
            positionArray.push(x);
            flag++;
            num = 0;
            x = 0;
        }

    }
/*
    let numPoints = positionArray.length / 3;
    let colors = new Uint8Array(numPoints * 4);
    console.time('kl');
    for(let i = 0; i < numPoints; i++){

        let clod =  getTheLevelClod(9, level, tightBoxX, tightBoxY, tightBoxZ);

        levelArray.push(clod);

        positionArray[3 * i] = positionArray[3 * i] * scale + boxX;
        positionArray[3 * i + 1] = positionArray[3 * i + 1] * scale + boxY ;
        positionArray[3 * i + 2] = positionArray[3 * i + 2] * scale + boxZ;

        colors[4 * i + 0] = colorArray[3 * i + 0];
        colors[4 * i + 1] = colorArray[3 * i + 1];
        colors[4 * i + 2] = colorArray[3 * i + 2];
        colors[4 * i + 3] = 255;
        var decimal = z - Math.floor(z);

        if (z > 20.0) {
            decimal = (z - 20.0) * 0.1;
            colors[4 * i + 0] = 255;
            colors[4 * i + 1] = 165.0 - 165.0 * decimal;
            colors[4 * i + 2] = 0;
            colors[4 * i + 3] = 255;

        } else if (z > 15.0) {
            decimal = (z - 15.0) * 0.2;
            colors[4 * i + 0] = 255;
            colors[4 * i + 1] = 255.0 - 90.0 * decimal;
            colors[4 * i + 2] = 0;
            colors[4 * i + 3] = 255;

        } else if (z > 10.0) {
            decimal = (z - 10.0) * 0.2;
            colors[4 * i + 0] = decimal;
            colors[4 * i + 1] = 255;
            colors[4 * i + 2] = 0;
            colors[4 * i + 3] = 255;

        } else if (z > 5.0) {
            decimal = (z - 5.0) * 0.2;
            colors[4 * i + 0] = 0;
            colors[4 * i + 1] = 139.0 + 116.0 * decimal;
            colors[4 * i + 2] = 139.0 - 139.0 * decimal;
            colors[4 * i + 3] = 255;

        } else if (z > 0.0) {
            decimal = (z - 0.0) * 0.2;
            colors[4 * i + 0] = 0;
            colors[4 * i + 1] = 139.0 * decimal;
            colors[4 * i + 2] = 255.0 - 116.0 * decimal;
            colors[4 * i + 3] = 255;
        }
    }
    console.timeEnd('kl');
*/
    positionArray = new Float32Array(positionArray);
    levelArray = new Float32Array(levelArray);

    let backmessage = {

        name:name,
        positionArray: positionArray,
        levelArray: levelArray,
    };

    postMessage(backmessage,[backmessage.positionArray.buffer, backmessage.levelArray.buffer]);

};