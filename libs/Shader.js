let Shaders = {};
Shaders["vshader"] = `

    uniform float screenHeight;
    uniform float far;
    uniform float near;
    uniform float maxLevel;
    uniform float level;
    uniform vec4 frustumPlanes[6];
    
    varying vec4 vColor;
    varying vec3 vViewPosition;//视坐标系
    varying float vLogDepth;
    varying mat4 proMatrix;
    varying float flag;
    
    
    void main() {
        
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        vLogDepth = log2(-mvPosition.z);
        vec3 p1 = vec3(position.x, position.y, position.z);
        float dis = distance(p1, cameraPosition);
        
        vec4 heightColor;
        proMatrix = projectionMatrix;
        //对顶点坐标进行转换
        vViewPosition = mvPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        
        float decimal = position.z - floor(position.z);
        if (position.z > 20.0) {
            decimal = (position.z - 20.0) * 0.1;
            heightColor[0] = 1.0;
            heightColor[1] = (165.0 - 165.0 * decimal) / 255.0;
            heightColor[2] = 0.0;
            heightColor[3] = 1.0;
            
        } else if (position.z > 15.0) {
            decimal = (position.z - 15.0) * 0.2;
            heightColor[0] = 1.0;
            heightColor[1] = (255.0 - 90.0 * decimal) / 255.0;
            heightColor[2] = 0.0;
            heightColor[3] = 1.0;
            
        } else if (position.z > 10.0) {
            decimal = (position.z - 10.0) * 0.2;
            heightColor[0] = decimal;
            heightColor[1] = 1.0;
            heightColor[2] = 0.0;
            heightColor[3] = 1.0;
            
        } else if (position.z > 5.0) {
            decimal = (position.z - 5.0) * 0.2;
            heightColor[0] = 0.0;
            heightColor[1] = (139.0 + 116.0 * decimal) / 255.0;
            heightColor[2] = (139.0 - 139.0 * decimal) / 255.0;
            heightColor[3] = 1.0;
            
        } else if (position.z > 0.0) {
            decimal = (position.z - 0.0) * 0.2;
            heightColor[0] = 0.0;
            heightColor[1] = (139.0 * decimal) / 255.0;
            heightColor[2] = (255.0 - 116.0 * decimal) / 255.0;
            heightColor[3] = 1.0;
           
        }        
        vColor = heightColor;
        
        float pointSize = maxLevel - dis * level / far * maxLevel;        
        if(level < 3.0){
                 
            for(int i = 0; i < 6; i++){
                    
                float dTP = (frustumPlanes[i][0] * position.x + frustumPlanes[i][1] * position.y + frustumPlanes[i][2] * position.z);
                dTP = dTP + frustumPlanes[i][3];
                if ( dTP < 0.0 ) {
                                    
                    pointSize = 50.0 / 3.0;
                    gl_PointSize = pointSize;
                    //gl_PointSize = 3.0;
                    return;
                }
            }    
        }
         
        pointSize = 50.0 / pointSize;
        pointSize = min(50.0 / 3.0, pointSize);    
        gl_PointSize = pointSize;               
        //gl_PointSize = 3.0;
               
    }`;

Shaders["low_fshader"] = `
    
    uniform vec4 color;
    uniform float far;
    uniform float near;
    varying vec4 vColor;
    varying vec3 vViewPosition;
    varying float vLogDepth;
    varying mat4 proMatrix;
    varying float flag;
    
    void main() {   
        
        
        float u = 2.0 * gl_PointCoord.x - 1.0;
		float v = 2.0 * gl_PointCoord.y - 1.0;   
		float wi = 0.0 - ( u*u + v*v);
		
        float cc = u*u + v*v;
		if(cc > 1.0){
			discard;
		}
		
        gl_FragColor = vColor;
        /*
        float distance = 2.0 * length(gl_PointCoord.xy - 0.5);
		float weight = max(0.0, 1.0 - distance);
		weight = pow(weight, 1.5);
		gl_FragColor.xyz = gl_FragColor.xyz * weight;
        */
        gl_FragColor.a = vLogDepth;
    } 
`;

Shaders["high_fshader"] = `
   
    uniform vec4 color;
    
    varying vec4 vColor;
    varying vec3 vViewPosition;
    varying float vLogDepth;
    varying mat4 proMatrix;
    
    void main() {
        vec3 color = vColor.rgb;
        float depth = gl_FragCoord.z;
        float vRadius = 10.0;
        
        //绘制圆形
        float u = 2.0 * (gl_PointCoord.x - 0.5);
        float v = 2.0 * (gl_PointCoord.y - 0.5);
        float cc = u*u + v*v;
		if(cc > 1.0){
			discard;
		}
       
        float wi = 0.0 - ( u*u + v*v);
		vec4 pos = vec4(vViewPosition, 1.0);
		pos.z += wi * vRadius;
		
		float vLogDepth = log2(-vViewPosition.z);
		float linearDepth = -pos.z;
		
		pos = proMatrix * pos;
		pos = pos / pos.w;
		float expDepth = pos.z;
		depth = (pos.z + 1.0) / 2.0;
		gl_FragDepthEXT = depth;
		
		color.r = linearDepth;
		color.g = expDepth;
	
        gl_FragColor = vColor;
       
        // High-Quality Splats
        
        float distance = 2.0 * length(gl_PointCoord.xy - 0.5);
		float weight = max(0.0, 1.0 - pow(distance, 2.0));
		weight = pow(weight, 2.0);
		gl_FragColor.a = weight;
		gl_FragColor.xyz = gl_FragColor.xyz * weight;
        
    } 
`;

Shaders["vshaders"] = `

    uniform float size;
    uniform float screenHeight;
    uniform float far;
    uniform float near;
    uniform vec3 eyePosition;
    uniform float maxLevel;
    uniform vec4 frustumPlanes[6];
    
    attribute float level;
    
    varying vec4 vColor;
    varying vec3 vViewPosition;//视坐标系
    varying float vLogDepth;
    varying mat4 proMatrix;
    varying float flag;
    
    void main() {
        
        if(level <= 3.0){
                    
        }
        else{
        
            for(int i = 0; i < 6; i++){
                
                float dTP = (frustumPlanes[i][0] * position.x + frustumPlanes[i][1] * position.y + frustumPlanes[i][2] * position.z);
                dTP = dTP + frustumPlanes[i][3];
                if ( dTP < 0.0 ) {
                
                    flag = 0.0;
                    return;
                }
            }
        }
        vec3 p1 = vec3(position.x, position.y, position.z);
        float dis = distance(p1, cameraPosition);
        
        if(level <= 3.0){
            flag = 1.0;
        }
        else{
        
            if(level < maxLevel - dis * level / far * maxLevel){
            
                flag = 1.0;
               
            }
            else{
            
                flag = 0.0;
                return;
            } 
        }
        
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        vLogDepth = log2(-mvPosition.z);
        
        vec4 heightColor;
        float decimal = position.z - floor(position.z);
        
        if (position.z > 20.0) {
            decimal = (position.z - 20.0) * 0.1;
            heightColor[0] = 1.0;
            heightColor[1] = (165.0 - 165.0 * decimal) / 255.0;
            heightColor[2] = 0.0;
            heightColor[3] = 1.0;
            
        } else if (position.z > 15.0) {
            decimal = (position.z - 15.0) * 0.2;
            heightColor[0] = 1.0;
            heightColor[1] = (255.0 - 90.0 * decimal) / 255.0;
            heightColor[2] = 0.0;
            heightColor[3] = 1.0;
            
        } else if (position.z > 10.0) {
            decimal = (position.z - 10.0) * 0.2;
            heightColor[0] = decimal;
            heightColor[1] = 1.0;
            heightColor[2] = 0.0;
            heightColor[3] = 1.0;
        } else if (position.z > 5.0) {
            decimal = (position.z - 5.0) * 0.2;
            heightColor[0] = 0.0;
            heightColor[1] = (139.0 + 116.0 * decimal) / 255.0;
            heightColor[2] = (139.0 - 139.0 * decimal) / 255.0;
            heightColor[3] = 1.0;
            
        } else if (position.z > 0.0) {
            decimal = (position.z - 0.0) * 0.2;
            heightColor[0] = 0.0;
            heightColor[1] = (139.0 * decimal) / 255.0;
            heightColor[2] = (255.0 - 116.0 * decimal) / 255.0;
            heightColor[3] = 1.0;
           
        }
        
        vColor = heightColor;
        proMatrix = projectionMatrix;        
       
        float pointSize = dis/100.0;
        pointSize = max(6.5, pointSize);
        pointSize = min(8.5, pointSize);           
        gl_PointSize = pointSize;
        
        
        //对顶点坐标进行转换
        vViewPosition = mvPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                       
    }
`;

Shaders["DLOD_vshader"] = `

    uniform float size;
    uniform float screenHeight;
    uniform float far;
    uniform float near;
    uniform vec4 level;
    uniform vec3 eyePosition;
    
    varying vec4 vColor;
    varying vec3 vViewPosition;//视坐标系
    varying float vLogDepth;
    varying mat4 proMatrix;
    varying float flag;
    void main() {
            
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        vLogDepth = log2(-mvPosition.z);
        
        vec4 heightColor;
        
        float decimal = position.z - floor(position.z);
        if (position.z > 20.0) {
            decimal = (position.z - 20.0) * 0.1;
            heightColor[0] = 1.0;
            heightColor[1] = (165.0 - 165.0 * decimal) / 255.0;
            heightColor[2] = 0.0;
            heightColor[3] = 1.0;
            
        } else if (position.z > 15.0) {
            decimal = (position.z - 15.0) * 0.2;
            heightColor[0] = 1.0;
            heightColor[1] = (255.0 - 90.0 * decimal) / 255.0;
            heightColor[2] = 0.0;
            heightColor[3] = 1.0;
            
        } else if (position.z > 10.0) {
            decimal = (position.z - 10.0) * 0.2;
            heightColor[0] = decimal;
            heightColor[1] = 1.0;
            heightColor[2] = 0.0;
            heightColor[3] = 1.0;
            
        } else if (position.z > 5.0) {
            decimal = (position.z - 5.0) * 0.2;
            heightColor[0] = 0.0;
            heightColor[1] = (139.0 + 116.0 * decimal) / 255.0;
            heightColor[2] = (139.0 - 139.0 * decimal) / 255.0;
            heightColor[3] = 1.0;
            
        } else if (position.z > 0.0) {
            decimal = (position.z - 0.0) * 0.2;
            heightColor[0] = 0.0;
            heightColor[1] = (139.0 * decimal) / 255.0;
            heightColor[2] = (255.0 - 116.0 * decimal) / 255.0;
            heightColor[3] = 1.0;
           
        }
                
        vColor = heightColor;
        
        proMatrix = projectionMatrix;
        float distance = sqrt(pow(eyePosition[0] - position.x, 2.0) + pow(eyePosition[1] - position.y, 2.0) + pow(eyePosition[2] - position.z, 2.0));
        float pointSize = distance/100.0;
        pointSize = max(6.5, pointSize);
        pointSize = min(8.5, pointSize);
        gl_PointSize = pointSize;
       
        //对顶点坐标进行转换
        vViewPosition = mvPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
       
    }`;