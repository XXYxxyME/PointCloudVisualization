
function text1(){

    return new Promise((resolve, reject) => {
        setTimeout(function () {

            resolve('1111111111');//返回写函数里面你要执行的内容
        },300)

    })


}
function text2(){

    console.log('22222222222')
}



function timeFN(){
    text1().then((data) => {

        text2();
        console.log(data);
    })
}


function drawqueue_test() {

    let x = camera.position.x;
    let y = camera.position.z;
    let z = camera.position.y;
    let num1 = 0;
    let num2 = 0;
    let frustum = new THREE.Frustum();
    frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    for(let j = 0; j < drawQueue.length; j++){

        num1 += Pco.nodes[drawQueue[j]].geometry.attributes['position'].count;
        console.log(drawQueue[j],Pco.nodes[drawQueue[j]].geometry.attributes['position'].count);
        for (let i = 0; i < Pco.nodes[drawQueue[j]].geometry.attributes['position'].count; i++) {

            let px = Pco.nodes[drawQueue[j]].geometry.attributes['position'].array[3 * i];
            let py = Pco.nodes[drawQueue[j]].geometry.attributes['position'].array[3 * i + 1];
            let pz = Pco.nodes[drawQueue[j]].geometry.attributes['position'].array[3 * i + 2];
            let level = Pco.nodes[drawQueue[j]].geometry.attributes['level'].array[i];
            let isInFrustum = frustum.containsPoint(new THREE.Vector3(px, py, pz));
            if (isInFrustum || level <= 3) {

                let dx = Math.pow(px - x, 2);
                let dy = Math.pow(pz - y, 2);
                let dz = Math.pow(py - z, 2);

                let dis = Math.sqrt(dx + dy + dz);
                let relDis = gui.maxLevel - dis * level * 2.0 / gui.far * gui.maxLevel;

                if (level < relDis || level <= 3) {
                    num2++;
                }
            }
        }
    }
    console.log(drawQueue.length, " ", num1 ," ",num2);
}

//importScripts
//<link href="cesium.css" rel="stylesheet" type="text/css" media="all">
//<body onmousedown="mousedown()" onmouseup="mouseup()" onkeyup="keyup(event)" onkeydown="keydown(event)"  >
/*
dot: function ( v ) {

    return this.x * v.x + this.y * v.y + this.z * v.z;

},

containsPoint: function ( point ) {

    var planes = this.planes;

    for ( var i = 0; i < 6; i ++ ) {

        if ( planes[ i ].distanceToPoint( point ) < 0 ) {

            return false;

        }

    }

    return true;

}

distanceToPoint: function ( point ) {

    return this.normal.dot( point ) + this.constant;

},
*/
/*
positionArray = new Float32Array(positionArray);
levelArray = new Float32Array(levelArray);

let backmessage = {

    positionArray: positionArray,
    levelArray: levelArray,
};

postMessage(backmessage,[backmessage.positionArray.buffer, backmessage.levelArray.buffer]);


worker.onmessage = function (message) {

    //workerPool.returnWorker(workerPath, worker);
    Pco.nodes[nodeName].analysisFlag = 88;

    let positionBuffer = new THREE.BufferAttribute(message.data.positionArray, 3);
    let levelBuffer = new THREE.BufferAttribute(message.data.levelArray, 1);

    Pco.nodes[nodeName].geometry.addAttribute('position', positionBuffer);
    Pco.nodes[nodeName].geometry.addAttribute('level', levelBuffer);

    drawSingleNode(nodeName);
    flag.webNum++;
    if(flag.webNum === requestQueue.length){

        after = new Date().getTime();
        console.log(flag.webNum, after-before,flag.dbpointsNum);
    }

};

 */