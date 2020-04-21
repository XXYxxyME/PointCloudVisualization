let Shaders1 = {};
Shaders["edl.vs"] = `
precision mediump float;
precision mediump int;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

varying vec2 vUv;

void main() {
	vUv = uv;
	
	vec4 mvPosition = modelViewMatrix * vec4(position,1.0);

	gl_Position = projectionMatrix * mvPosition;
}`;

Shaders["edl.fs"] = `
#extension GL_EXT_frag_depth : enable

// 
// adapted from the EDL shader code from Christian Boucheny in cloud compare:
// https://github.com/cloudcompare/trunk/tree/master/plugins/qEDL/shaders/EDL
//

precision mediump float;
precision mediump int;

uniform float screenWidth;
uniform float screenHeight;
uniform vec2 neighbours[NEIGHBOUR_COUNT];
uniform float edlStrength;
uniform float radius;
uniform float opacity;

uniform float uNear;
uniform float uFar;

uniform mat4 uProj;

uniform sampler2D uEDLColor;
uniform sampler2D uEDLDepth;

varying vec2 vUv;

float response(float depth){
	vec2 uvRadius = radius / vec2(screenWidth, screenHeight);
	
	float sum = 0.0;
	
	for(int i = 0; i < NEIGHBOUR_COUNT; i++){
		vec2 uvNeighbor = vUv + uvRadius * neighbours[i];
		
		float neighbourDepth = texture2D(uEDLColor, uvNeighbor).a;
		neighbourDepth = (neighbourDepth == 1.0) ? 0.0 : neighbourDepth;

		if(neighbourDepth != 0.0){
			if(depth == 0.0){
				sum += 100.0;
			}else{
				sum += max(0.0, depth - neighbourDepth);
			}
		}
	}
	
	return sum / float(NEIGHBOUR_COUNT);
}

void main(){
	vec4 cEDL = texture2D(uEDLColor, vUv);
	
	float depth = cEDL.a;
	depth = (depth == 1.0) ? 0.0 : depth;
	float res = response(depth);
	float shade = exp(-res * 300.0 * edlStrength);

	gl_FragColor = vec4(cEDL.rgb * shade, opacity);

	{ // write regular hyperbolic depth values to depth buffer
		float dl = pow(2.0, depth);

		vec4 dp = uProj * vec4(0.0, 0.0, -dl, 1.0);
		float pz = dp.z / dp.w;
		float fragDepth = (pz + 1.0) / 2.0;

		gl_FragDepthEXT = fragDepth;
	}

	if(depth == 0.0){
		discard;
	}

}
`;

class EyeDomeLightingMaterial extends THREE.RawShaderMaterial{

    constructor(parameters = {}){
        super();

        let uniforms = {
            screenWidth:    { type: 'f', 	value: 0 },
            screenHeight:   { type: 'f', 	value: 0 },
            edlStrength:    { type: 'f', 	value: 1.0 },
            uNear:          { type: 'f', 	value: 1.0 },
            uFar:           { type: 'f', 	value: 1.0 },
            radius:         { type: 'f', 	value: 1.0 },
            neighbours:     { type: '2fv', 	value: [] },
            depthMap:       { type: 't', 	value: null },
            uEDLColor:      { type: 't', 	value: null },
            uEDLDepth:      { type: 't', 	value: null },
            opacity:        { type: 'f',	value: 1.0 },
            uProj:          { type: "Matrix4fv", value: [] },
        };

        this.setValues({
            uniforms: uniforms,
            vertexShader: this.getDefines() + Shaders1['edl.vs'],
            fragmentShader: this.getDefines() + Shaders1['edl.fs'],
            lights: false
        });

        this.neighbourCount = 8;
    }

    getDefines() {
        let defines = '';

        defines += '#define NEIGHBOUR_COUNT ' + this.neighbourCount + '\n';

        return defines;
    }

    updateShaderSource() {

        let vs = this.getDefines() + Shaders1['edl.vs'];
        let fs = this.getDefines() + Shaders1['edl.fs'];

        this.setValues({
            vertexShader: vs,
            fragmentShader: fs
        });

        this.uniforms.neighbours.value = this.neighbours;

        this.needsUpdate = true;
    }

    get neighbourCount(){
        return this._neighbourCount;
    }

    set neighbourCount(value){
        if (this._neighbourCount !== value) {
            this._neighbourCount = value;
            this.neighbours = new Float32Array(this._neighbourCount * 2);
            for (let c = 0; c < this._neighbourCount; c++) {
                this.neighbours[2 * c + 0] = Math.cos(2 * c * Math.PI / this._neighbourCount);
                this.neighbours[2 * c + 1] = Math.sin(2 * c * Math.PI / this._neighbourCount);
            }

            this.updateShaderSource();
        }
    }


}

