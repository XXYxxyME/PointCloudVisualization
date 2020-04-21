THREE.txtLoader = function () {};
THREE.txtLoader.prototype = {
    constructor: THREE.txtLoader,
    load: function ( url ) {
        let xhr = new XMLHttpRequest(),
            okStatus = document.location.protocol === "file:" ? 0 : 200;
        xhr.open('GET', url, false);
        xhr.overrideMimeType("text/html;charset=utf-8");//默认为utf-8
        xhr.send(null);
        if(xhr.status === okStatus)
        {
            var geometry = this.parse(xhr.responseText);
            //if ( callback ) callback( geometry );
        }
        return geometry;
    },

    parse: function ( data ) {

        var geometry = new THREE.Geometry();
        function vertex( x, y, z ) {
            geometry.vertices.push( new THREE.Vector3( x, y, z ) );
        }
        var pattern, result;
        // float float float
        pattern = /([\+|\-]?[\d]+[\.][\d]+)[ ]+([\+|\-]?[\d]+[\.][\d]+)[ ]+([\+|\-]?[\d]+[\.][\d]+)/g;

        while ( ( result = pattern.exec( data ) ) != null) {
            // ["1.0 2.0 3.0", "1.0", "2.0", "3.0"]

            vertex( parseFloat( result[ 1 ] ), parseFloat( result[ 2 ] ), parseFloat( result[ 3 ] ) );
            //console.log(result[ 1 ],result[ 2 ],result[ 3 ]);
        }
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
        return geometry;
    },
}