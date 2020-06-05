
"use strict";

const vertex_shader = `


mat4 translateM(vec3 tr) {
    return mat4(1.0, 0.0, 0.0, 0.0,
                0.0, 1.0, 0.0, 0.0,
                0.0, 0.0, 1.0, 0.0,
                tr.x, tr.y, tr.z, 1.0);
}

mat4 scaleM(vec3 sc) {
    return mat4(sc.x, 0.0, 0.0, 0.0,
                0.0, sc.y, 0.0, 0.0,
                0.0, 0.0, sc.z, 0.0,
                0.0, 0.0, 0.0, 1.0);
}

mat4 rotateX(float theta) {
  float c = cos( radians(theta) );
  float s = sin( radians(theta) );
  mat4 rx = mat4( 1.0,  0.0,  0.0, 0.0,
      0.0,  c,  -s, 0.0,
      0.0, s,  c, 0.0,
      0.0,  0.0,  0.0, 1.0 );
  return rx;
}

mat4 rotateY(float theta) {
  float c = cos( radians(theta) );
  float s = sin( radians(theta) );
  mat4 rx = mat4( c, 0.0, s, 0.0,
      0.0, 1.0,  0.0, 0.0,
      -s, 0.0,  c, 0.0,
      0.0, 0.0,  0.0, 1.0 );
  return rx;
}

mat4 rotateZ(float theta) {
  float c = cos( radians(theta) );
  float s = sin( radians(theta) );
  mat4 rx = mat4( c, -s, 0.0, 0.0,
      s,  c, 0.0, 0.0,
      0.0,  0.0, 1.0, 0.0,
      0.0,  0.0, 0.0, 1.0 );
  return rx;
}




attribute vec4 vertex;
attribute vec4 normal;

uniform vec3 translateP, scaleP, angleP;
// uniform mat4 model_transform;
uniform mat4 view_projection_transform;
// uniform mat4 normal_transform;



varying vec4 obj_loc;
varying vec4 v_norm;

void main()
{
    mat4 model_transform = translateM(translateP) * rotateZ(angleP.z) * 
            rotateY(angleP.y) * rotateX(angleP.x) * scaleM(scaleP);
    mat4 normal_transform = rotateZ(angleP.z) * 
            rotateY(angleP.y) * rotateX(angleP.x) * scaleM(1.0 / scaleP);
    obj_loc = model_transform * vertex;  // location in model coordinates
    gl_Position = view_projection_transform * obj_loc ;  // location in default coordinates
    v_norm = normal_transform * normal;  // unnormalized normal

 
}`;

const fragment_shader = `
precision mediump float;

uniform vec4 mat_ambient;
uniform vec4 mat_diffuse;
uniform vec4 mat_specular;
uniform float mat_shininess;
uniform vec4 light_ambient;
uniform vec4 light_diffuse;
uniform vec4 light_specular;
uniform vec4 light_position;
uniform vec4 camera_position;


varying vec4 obj_loc;
varying vec4 v_norm;

void
main()
{

 
    vec4 l_vec = normalize(light_position - obj_loc);
    vec4 n_vec = normalize(v_norm);
    float lndot = dot(l_vec, n_vec);
    float diffuse_scale = max(0.0, lndot);
    vec4 diffuse_color = diffuse_scale * light_diffuse * mat_diffuse;
    
    
    vec4 h_vec = normalize(l_vec + normalize(camera_position - obj_loc));
    float spec_scale = pow(max(0.0, dot(h_vec, n_vec)), mat_shininess);
    vec4 specular_color;
    if(lndot < 0.0) {
        specular_color = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        specular_color = spec_scale * mat_specular * light_specular;
    }
    
    vec4 ambient_color = mat_ambient * light_ambient; 
    
    vec4 preprocess = ambient_color + diffuse_color + specular_color; //formerly gl_FragColor in Assn5
    float luminance = (0.2126 * preprocess.x) + (0.7152 * preprocess.y) + (0.0722 * preprocess.z);
    gl_FragColor = vec4(luminance, luminance, luminance, 1.0);
   
}
`;




window.onload = function init()
{
    const canvas = document.getElementById("gl-canvas");
    const gl = canvas.getContext('webgl');
    if (!gl) alert( "WebGL isn't available" );
    gl.enable(gl.DEPTH_TEST);


    //
    //  Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(... X11.DarkGray);

    // create program from shader and set it active
    const program = initShaders(gl, vertex_shader, fragment_shader);
    gl.useProgram(program);


    let shape_list = [];

    let clockFace = new cs4722_Shapes.Cylinder(1, 36);
    clockFace.scheme_colors = [X11.Brown, X11.Brown];
    shape_list.push(clockFace);

    let clockTick = new cs4722_Shapes.Block();
    clockTick.scheme_colors = [X11.White, X11.White];
    shape_list.push(clockTick);

    let clockHand = new cs4722_Shapes.Block();
    clockHand.scheme_colors = [X11.White, X11.White];
    shape_list.push(clockHand);

    setup_shape_buffers(shape_list, gl, program, false, true, false, true);


    let numClockTicks = 12;

    let object_list = [];

    //push the clock face first
    object_list.push
    (
        {
            translate: [0, 0, -1],
            angle: [90, 0, 0,],
            angle_rates: [0, 0, 0],
            scale: [.75, .1, .75],
            material:
            {
                ambient: X11.DarkSlateGray,
                diffuse: X11.DarkSlateGray,
                specular: X11.White,
                shininess: 10,
            },
            shape: shape_list[0],
        },
    );

    //clock tick marks next
    for(let objIndex = 1; objIndex <= numClockTicks; objIndex++)
    {
        object_list.push
        (
            {
                translate: [.9 * object_list[0].scale[0] * Math.cos((360 / numClockTicks * objIndex) * (Math.PI / 180)),
                    .9 * object_list[0].scale[2] * Math.sin((360 / numClockTicks * objIndex) * (Math.PI / 180)),
                    object_list[0].translate[2] + (object_list[0].scale[1] / 2)],
                angle: [90, 0, -(360 / numClockTicks) * objIndex + 90],
                angle_rates: [0, 0, 0],
                scale: [.025, .05, .05],
                material:
                {
                    ambient: X11.DarkSlateGray4,
                    diffuse: X11.DarkSlateGray4,
                    specular: X11.White,
                    shininess: 10,
                },
                shape: shape_list[1],
            },
        );
    }

    //hands last
    //hour hand
    let clockSpinPeriod = .05;
    object_list.push
    (
        {
            translate: [0, 0, object_list[0].translate[2] + (object_list[0].scale[1] / 2)],
            angle: [90, 0, -90,],
            angle_rates: [0, 0, 1 / clockSpinPeriod],
            scale: [.05, .075, .75],
            material:
                {
                    ambient: X11.DarkRed,
                    diffuse: X11.DarkRed,
                    specular: X11.White,
                    shininess: 10,
                },
            shape: shape_list[2],
        },
    );

    //minute hand
    object_list.push
    (
        {
            translate: [0, 0, object_list[0].translate[2] + (object_list[0].scale[1] / 2)],
            angle: [90, 0, -90,],
            angle_rates: [0, 0, 1 / clockSpinPeriod / 12],
            scale: [.05, .07, .5],
            material:
                {
                    ambient: X11.DarkBlue,
                    diffuse: X11.DarkBlue,
                    specular: X11.White,
                    shininess: 10,
                },
            shape: shape_list[2],
        },
    );

    //oh no almost forgot the teapot
    //unfortunately im not sure how to make the teapot work?
    //i have the script imported but all it has is its vertices/normals/edges
    //the cs4722-shapes class has a lot more information that object_list is
    //assuming that it has...
    //not sure how to make it work short of writing up new methods
    object_list.push
    (
        {
            translate: [0, 0, 0],
            angle: [0, 0, 0,],
            angle_rates: [30, 30, 30],
            scale: [.01, .01, .01],
            material:
                {
                    ambient: X11.Blue,
                    diffuse: X11.Blue,
                    specular: X11.White,
                    shininess: 10,
                },
            shape: teapot_0854590,
        },
    );

    document.getElementById("object-count").innerText = object_list.length.toString();

    let light = {
        position: vec4(0, 0, 1, 1),
        ambient: X11.Gray50,
        diffuse: X11.Gray100,
        specular: X11.White,
    };


    // projection parameters
    let proj_far = 200;
    let proj_near = 1/proj_far;
    let proj_aspect = canvas.width / canvas.height;
    let proj_fov = 90;


    const camera = new cs4722_camera();
    camera.setup_callbacks(canvas);
    camera.camera_position = vec3(0, 0, 0);



    let last_time = 0;  // last time animation took place

    function animate(time) {

        // time, in milliseconds, between time and the last time animate2 was called
        let delta_time = time - last_time;
        // change last_time to be ready for the next animate2 call
        last_time = time;

        //(this completely broke lol)
        // if(delta_time > 0) {
        //     // frame rate is the reciprocal of the time between animation calls
        //     //  1000 since delta_time is in milliseconds and the frame rate is frames per second
        //     let frame_rate = ((1000 / delta_time) + 5*displayed_frame_rate)/6;
        //     // only display the frame rate if it has changed more than 1 frame/second from
        //     // the last time it was displayed.
        //     // if (Math.abs(frame_rate - displayed_frame_rate) > .1) {
        //     frame_rate_span.innerText = frame_rate.toFixed(3);
        //     displayed_frame_rate = frame_rate;
        //     // }
        // }



        // render the scene now that the change has been recorded
        render(time/1000);
        // Ask to animate again
        requestAnimationFrame(animate);
    }




    const scalePLoc = gl.getUniformLocation(program, "scaleP");
    const translatePLoc = gl.getUniformLocation(program, "translateP");
    const anglePLoc = gl.getUniformLocation(program, "angleP");

    // const mTransformLoc = gl.getUniformLocation(program, "model_transform");
    const vpTransformLoc = gl.getUniformLocation(program, "view_projection_transform");
    // const normalTransformLoc = gl.getUniformLocation(program, "normal_transform");
    const matAmbientLoc = gl.getUniformLocation(program, "mat_ambient");
    const matDiffuseLoc = gl.getUniformLocation(program, "mat_diffuse");
    const matSpecularLoc = gl.getUniformLocation(program, "mat_specular");
    const matShininessLoc = gl.getUniformLocation(program, "mat_shininess");
    const lightAmbientLoc = gl.getUniformLocation(program, "light_ambient");
    const lightDiffuseLoc = gl.getUniformLocation(program, "light_diffuse");
    const lightSpecularLoc = gl.getUniformLocation(program, "light_specular");
    const lightPositionLoc = gl.getUniformLocation(program, "light_position");
    const cameraPositionLoc = gl.getUniformLocation(program, "camera_position)");


    function render(time) {
        gl.clear(gl.COLOR_BUFFER_BIT + gl.DEPTH_BUFFER_BIT);

        // time, in milliseconds, between time and the last time animate2 was called
        let delta_time = time - last_time;
        // change last_time to be ready for the next animate2 call
        last_time = time;

        let view_tr = camera.get_view_transform();
        // console.log(view_tr);
        let proj_tr = perspective(proj_fov, proj_aspect, proj_near, proj_far);
        // console.log(proj_tr);
        let vp_tr = mult(proj_tr, view_tr);
        gl.uniformMatrix4fv(vpTransformLoc, false, flatten(vp_tr));

        // console.log(light.ambient);
        gl.uniform4f(lightAmbientLoc, ...light.ambient);
        gl.uniform4f(lightDiffuseLoc, ...light.diffuse);
        gl.uniform4f(lightPositionLoc, ...light.position);
        gl.uniform4f(lightSpecularLoc, ...light.specular);
        gl.uniform3f(cameraPositionLoc, ...camera.camera_position);

        for(let obj of object_list) {
            gl.uniform3f(translatePLoc, ...obj.translate);
            gl.uniform3f(scalePLoc, ...obj.scale);
            gl.uniform3f(anglePLoc, ...obj.angle);

            gl.uniform4f(matAmbientLoc, ...obj.material.ambient);
            gl.uniform4f(matDiffuseLoc, ...obj.material.diffuse);
            gl.uniform4f(matSpecularLoc, ...obj.material.specular);
            gl.uniform1f(matShininessLoc, obj.material.shininess);
            gl.drawArrays(gl.TRIANGLES, obj.shape.buffer_start, obj.shape.buffer_size);
        }

        //clock hands rotate here
        //two parts-- a transform
        object_list[numClockTicks + 1].translate[0] = .45 * object_list[0].scale[0] *
            Math.cos((-time * (Math.PI / 180) / clockSpinPeriod) + Math.PI / 2);
        object_list[numClockTicks + 1].translate[1] = .45 * object_list[0].scale[2] *
            Math.sin((time * (Math.PI / 180) / clockSpinPeriod) + Math.PI / 2);

        object_list[numClockTicks + 2].translate[0] = .3 * object_list[0].scale[0] *
            Math.cos((-time * (Math.PI / 180) / clockSpinPeriod / 12) + Math.PI / 2);
        object_list[numClockTicks + 2].translate[1] = .3 * object_list[0].scale[2] *
            Math.sin((time * (Math.PI / 180) / clockSpinPeriod / 12) + Math.PI / 2);

        //and a rotation
        object_list[numClockTicks + 1].angle[2] = object_list[numClockTicks + 1].angle_rates[2] * time;

        object_list[numClockTicks + 2].angle[2] = object_list[numClockTicks + 2].angle_rates[2] * time;

        //the light also animates
        //it moves in a circle similar to the hands
        light.position = [object_list[0].scale[0] * 2 * Math.cos((time * (Math.PI / 180) / clockSpinPeriod) + Math.PI / 2),
            object_list[0].scale[0] * 2 * Math.sin((time * (Math.PI / 180) / clockSpinPeriod) + Math.PI / 2), 1, 1];

        //and its color animates too
        light.ambient = new vec4(0, Math.cos(time * (Math.PI / 180) / clockSpinPeriod / 12),
            Math.sin(time * (Math.PI / 180) / clockSpinPeriod / 12) / 2, 1);
        light.diffuse = new vec4(0, Math.cos(time * (Math.PI / 180) / clockSpinPeriod / 12),
            Math.sin(time * (Math.PI / 180) / clockSpinPeriod / 12) / 2, 1);
    }

    // render();
    animate(0);
};


