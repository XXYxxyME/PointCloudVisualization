class pointCloudOctreeGeometry{

    constructor(){

        this.url = null;
        this.octreeDir = null;
        this.spacing = 0;
        this.boundingBox = null;
        this.root = null;
        this.nodes = null;
        this.pointAttributes = null;
        this.hierarchyStepSize = -1;
        this.scale = 0;
    }


}

class pointCloudTreeNode {

    constructor(name, boundingBox) {

        this.name = name;
        this.index = parseInt(name.charAt(name.length - 1));//0-7取最后一个字符
        this.geometry = new THREE.BufferGeometry();
        this.boundingBox = boundingBox;
        this.tightBoundingBox = null;
        this.boundingSphere = boundingBox.getBoundingSphere(new THREE.Sphere());
        this.children = {};
        this.level = null;
        this.analysisFlag = -1;
        this.renderRate = 0;
        this.isRendered = false;
    }

    getChildren() {

        let children = [];
        for (let i = 0; i < 8; i++) {
            if (this.children[i]) {
                children.push(this.children[i]);
            }
        }

        return children;
    }


    addChild(child) {

        this.children[child.index] = child;
        child.parent = this;
    }

}

class Utils {
    static createChildAABB(aabb, index){

        let min = aabb.min.clone();
        let max = aabb.max.clone();
        let size = new THREE.Vector3().subVectors(max, min);

        if ((index & 0b0001) > 0) {
            min.z += size.z / 2;
        } else {
            max.z -= size.z / 2;
        }

        if ((index & 0b0010) > 0) {
            min.y += size.y / 2;
        } else {
            max.y -= size.y / 2;
        }

        if ((index & 0b0100) > 0) {
            min.x += size.x / 2;
        } else {
            max.x -= size.x / 2;
        }

        return new THREE.Box3(min, max);
    }
    static generateDataTexture (width, height, color) {
        let size = width * height;
        let data = new Uint8Array(4 * width * height);

        let r = Math.floor(color.r * 255);
        let g = Math.floor(color.g * 255);
        let b = Math.floor(color.b * 255);

        for (let i = 0; i < size; i++) {
            data[ i * 3 ] = r;
            data[ i * 3 + 1 ] = g;
            data[ i * 3 + 2 ] = b;
        }

        let texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
        texture.needsUpdate = true;
        texture.magFilter = THREE.NearestFilter;

        return texture;
    }
}

