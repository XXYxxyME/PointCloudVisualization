
function xx() {

    let uniforms = {
        screenWidth: 	{ type: 'f', 	value: 0 },
        screenHeight: 	{ type: 'f', 	value: 0 },
        edlStrength: 	{ type: 'f', 	value: 1.0 },
        uNear:          { type: 'f', 	value: 1.0 },
        uFar:           { type: 'f', 	value: 1.0 },
        radius: 		{ type: 'f', 	value: 1.0 },
        neighbours:		{ type: '2fv', 	value: [] },
        depthMap: 		{ type: 't', 	value: null },
        uEDLColor:		{ type: 't', 	value: null },
        uEDLDepth:		{ type: 't', 	value: null },
        opacity:		{ type: 'f',	value: 1.0 },
        uProj:			{ type: "Matrix4fv", value: [] },
    };

    let rtEDL = new THREE.WebGLRenderTarget(1024, 1024, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        depthTexture: new THREE.DepthTexture(undefined, undefined, THREE.UnsignedIntType)
    });

    let rtRegular = new THREE.WebGLRenderTarget(1024, 1024, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        depthTexture: new THREE.DepthTexture(undefined, undefined, THREE.UnsignedIntType)
    });

    let pixelRatio = renderer.getPixelRatio();

    let a = new THREE.Vector2(0, 0);
    renderer.getSize(a);

    let width = a.x;
    let height = a.y;
    rtEDL.setSize(width * pixelRatio , height * pixelRatio);
    rtRegular.setSize(width * pixelRatio , height * pixelRatio);

    let proj = camera.projectionMatrix;
    let projArray = new Float32Array(16);

    projArray.set(proj.elements);
    uniforms.screenWidth.value = width;
    uniforms.screenHeight.value = height;
    uniforms.uNear.value = camera.near;
    uniforms.uFar.value = camera.far;
    uniforms.uEDLColor.value = rtEDL.texture;
    uniforms.uEDLDepth.value = rtEDL.depthTexture;
    uniforms.uProj.value = projArray;

    uniforms.edlStrength.value = 1.0;
    uniforms.radius.value = 1.0;
    uniforms.opacity.value = 1;
    let defines = '';
    defines += '#define NEIGHBOUR_COUNT ' + 8 + '\n';
    let neighbours = new Float32Array(8 * 2);
    for (let c = 0; c < 8; c++) {
        neighbours[2 * c + 0] = Math.cos(2 * c * Math.PI / 8);
        neighbours[2 * c + 1] = Math.sin(2 * c * Math.PI / 8);
    }
    uniforms.neighbours.value = neighbours;
    let edlMaterial = new THREE.ShaderMaterial({

        uniforms: uniforms,

        vertexShader: defines + Shaders1["vshader"],

        fragmentShader: defines + Shaders1["fshader"],

    });

    edlMaterial.depthTest = true;
    edlMaterial.depthWrite = true;
    edlMaterial.transparent = true;
    return edlMaterial;
}


function loadBar() {

    if(prog === 500){

        clearCanvas();
        document.getElementById("bCanvas").style.visibility="hidden";
        return;
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.globalCompositeOperation = 'lighter';

    //Draw loading
    ctx.fillStyle = '#000';
    ctx.fillRect(canvasW/2-250, emitter.y-emitter.h/2, 500, emitter.h);
    ctx.strokeStyle = 'rgba(135,206,235,0.5)';
    ctx.strokeRect(canvasW/2-250, emitter.y-emitter.h/2, 500, emitter.h);
    ctx.font = '20pt Arial';
    ctx.fillStyle = 'rgba(135,206,235,0.5)';
    ctx.fillText(Math.floor(prog/5)+'%', canvasW/2-20, canvasH/2+10);

    //Move emitter

    if(stops[stopIndex] == prog) {
        stopIndex ++;
        delay = 50;
    } else {
        if(delay === 0 && prog < stops[stopIndex]) {
            emitter.dx = -1;
            emitter.x += 2;
            prog += 2;
        } else {
            emitter.dx = 0;
            delay --;
        }
    }

    //Draw emitter
    ctx.fillStyle = '#00FFFF';
    ctx.fillRect(emitter.x, emitter.y-emitter.h/2, 1, emitter.h);

    //Draw particles
    var i = 0;
    for(i in particles) {
        var p = particles[i];

        //Check if die
        if(time > p.die) {
            p.o -= 0.01;
            if(p.o < 0) {
                particles.splice(i, 1);
            }
        }

        //Add v
        p.x += p.vx;
        p.y += p.vy;

        //Add source move
        p.x += p.sourcedx / 10;
        p.y += p.sourcedy / 10;

        //Simplex noise
        if(p.simplexIndex > simplexStart) {
            p.simplexVal = simplex.noise3D(p.x/100, p.y/100, time/100);
        }

        p.simplexIndex ++;
        p.x += p.simplexVal;
        p.y += p.simplexVal;

        //If (almost) outside canvas
        if(p.x < 0+20 || p.x > canvasW-20) {
            p.vx *= -1.015;
        }
        if(p.y < 0+20 || p.y > canvasH-20) {
            p.vy *= -1.015;
        }

        ctx.beginPath();
        ctx.fillStyle = 'rgba(30, 144, 255, '+p.o+')';
        ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.save();
    }

    //if emitter is moving
    if(emitter.dx !== 0) {
        for(var i=0; i<rate; i++) {
            //Create particle
            var particle = {
                x: emitter.x,
                y: emitter.y+(Math.random()*emitter.h-emitter.h/2),
                r: Math.random()+0.5,
                vx: (Math.random()*-2),
                vy: (Math.random()-0.5),
                o: 1,
                birth: time,
                die: time+(Math.random()*50+50),//1+1),
                sourcedx: emitter.dx,
                sourcedy: emitter.dy,
                red: Math.round(Math.random()*255),
                green: Math.round(Math.random()*255),
                blue: Math.round(Math.random()*255),
                simplexVal: 0,
                simplexIndex: 0
            };

            particles.push(particle);
        }
    }

    time++;
    window.requestAnimationFrame(loadBar);

}


function abolishRequest(){

    let unfinishedRequest = 0;

    for(let i = 0; i < requestQueue.length; i++)
    {
        let node = Pco.nodes[requestQueue[i]];
        {
            if (node.geometry == null && node.xhr != null){

                unfinishedRequest++;
                node.xhr.abort();

            }
        }
    }

    console.log('需要服务器传输的节点数有', requestQueue.length, '个，其中未完成的节点数有', unfinishedRequest, '个');
}

function readHrc() {

    for(let i = 0; i < drawQueue.length; i++){
        if((drawQueue[i].length - 1) % 5 === 0){

            let j = hrcName.indexOf(drawQueue[i]);
            if(j > -1){
                hrcLoader.loadHierachyFromPotree(hrcName[j]);
            }
            hrcName.remove(drawQueue[i]);
        }
    }

}
//两个数组取不同元素
function getArrDifference(arr1, arr2) {

    return arr1.concat(arr2).filter(function(v, i, arr) {

        return arr.indexOf(v) === arr.lastIndexOf(v);

    });

}
//两个数组取相同元素
function getArrEqual(arr1, arr2){
    let newArr = [];
    for (let i = 0; i < arr2.length; i++) {
        for (let j = 0; j < arr1.length; j++) {
            if (arr1[j] === arr2[i]) {
                newArr.push(arr1[j]);
            }
        }
    }
    return newArr;
}

function calculateDis(x1, y1, z1, x2, y2, z2) {

    return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2) + Math.pow((z1 - z2), 2));

}

Array.prototype.indexOf = function(val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == val) return i;
    }
    return -1;
};

Array.prototype.remove = function(val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};

function encodeUtf8(text) {
    const code = encodeURIComponent(text);
    const bytes = [];
    for (var i = 0; i < code.length; i++) {
        const c = code.charAt(i);
        if (c === '%') {
            const hex = code.charAt(i + 1) + code.charAt(i + 2);
            const hexVal = parseInt(hex, 16);
            bytes.push(hexVal);
            i += 2;
        } else bytes.push(c.charCodeAt(0));
    }
    return bytes;
}
//将utf8编码的字节数组转换未文本
function decodeUtf8(bytes) {
    var encoded = "";
    for (var i = 0; i < bytes.length; i++) {
        encoded += '%' + bytes[i].toString(16);
    }
    return decodeURIComponent(encoded);
}

