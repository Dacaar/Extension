// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

var conectar = document.getElementById('conectar');
conectar.onclick = conectaBD;

var forms = document.getElementById("formularios");
var formularios_msg = document.getElementById("formularios_label");
var formulario_activo;

var asignar = document.getElementById("asignar");
var configurar = document.getElementById("configurar");
var desplegable_campos = document.getElementById("campos");
var desplegable_tablas = document. getElementById("tablas");
var desplegable_atributos = document.getElementById("atributos");

forms.onchange = function(){
  getFormularioElegido(forms.value).then(function(form_elegido){
    compruebaCorreccion(form_elegido);
  });
}
var formulario_modificado;
configurar.onclick = activaConfiguracion;

var info_asignacion = document.getElementById("info_asignaciones");

desplegable_tablas.onchange = function(){
  let indice = desplegable_tablas.value;
  getAtributos(indice).then(function(atributos){
    let atributos_parseados = JSON.parse(atributos);
    let opcion = document.createElement("option");
    for (var i in atributos_parseados){
      opcion.text = atributos_parseados[i].nombre;
      desplegable_atributos.options[desplegable_atributos.options.length] = new Option(opcion.text, i);
    }
  });
}

asignar.onclick = realizaAsignacion;



var autorrellenar = document.getElementById('autorrellena');
autorrellenar.onclick = rellena;



function conectaBD(){
  let mensaje = document.getElementById('mensaje');
  var textbox = document.getElementById('username');
  let params = '{"username":"';
  let request = new XMLHttpRequest();

  params = params + textbox.value + '"}';

  request.open("POST", "http://localhost:49787/api/BBDD", true);

  //Send the proper header information along with the request
  request.setRequestHeader("Content-type", "application/json");

  request.onreadystatechange = function() {//Call a function when the state changes.
    if(request.readyState == XMLHttpRequest.DONE && request.status == 200) {
      mensaje.innerHTML = "Conectado a la base de datos.";
      forms.disabled = false;
      conectar.disabled = true;
      textbox.disabled = true;
    }
  }
  request.send(params);
}

function rellena (){
  chrome.tabs.query({active: true, status: 'complete', currentWindow: true}, function (tabs){
    var activeTab = tabs[0];
    console.log(activeTab.url);
    
    chrome.tabs.executeScript(activeTab.id, {file: "content_script.js"}, function(){
    
      chrome.tabs.sendMessage(activeTab.id, {"formulario": forms.value})});
    });
}

function getCamposFormulario (){
  let tablas = formulario_activo.getElementsByTagName("tabla");
  let campos;
  let opcion = document.createElement("option");

  for (var i = 0; i < tablas.length; i++){
    campos = tablas[i].getElementsByTagName("campo");

    for (var j = 0; j < campos.length; j++){
      opcion.text = campos[j].getElementsByTagName("descripcion")[0].childNodes[0].nodeValue;
      if(opcion.text == "Terminos"){
      } else {
        desplegable_campos.options[desplegable_campos.options.length] = new Option(opcion.text, j);
      }
      
    }
  }  
}

//Función de test de rellenado correcto.
function compruebaCorreccion(form_activo){
  //Si selecciona contacto, comprobar que no haya un registro almacenado en chrome storage.
  //if yes, extrae el registro. else habilita configuracion.
  /*alert(form_activo);
  let form_serializado = new XMLSerializer().serializeToString(form_activo);
  alert(form_serializado);
  let parser = new DOMParser();
  let form_parseao = parser.parseFromString(form_serializado, "text/xml");
  alert(form_parseao);
  alert(new XMLSerializer().serializeToString(form_parseao));*/
  chrome.storage.local.clear();


  /*chrome.storage.local.getBytesInUse(['form'], function(bytes){
    alert(bytes);
  });

  chrome.storage.local.set({'form': form_serializado}, function() {
    alert("formulario guardado");
  });

  if (chrome.storage){
    chrome.storage.local.get('form', function(r) {
      alert(r.form);
    });
  }*/

  let tablas = form_activo.getElementsByTagName("tabla");
  let nombre = tablas[0].attributes.getNamedItem("valor").value;

  if (nombre == "no definida"){
    formularios_msg.innerHTML = "Formulario incompleto, configure antes de rellenar.";
    autorrellenar.disabled = true;
    configurar.disabled = false;
  } else {
    formularios_msg.innerHTML = "Rellene ahora!!!";
    autorrellenar.disabled = false;
    configurar.disabled = true;
    desplegable_atributos.disabled = true;
    desplegable_campos.disabled = true;
    desplegable_tablas.disabled = true;
  }
}

function activaConfiguracion(){
  asignar.disabled = false;
  desplegable_campos.disabled = false;
  desplegable_atributos.disabled = false;
  desplegable_tablas.disabled = false;
  
  let form_enString = new XMLSerializer().serializeToString(formulario_activo);
  formulario_modificado = new DOMParser().parseFromString(form_enString,"text/xml");

  limpiaDesplegableCampos();

  getCamposFormulario();

  getTablas().then(function(tablas){
    let tablas_parseadas = JSON.parse(tablas);
    let opcion = document.createElement("option");

    for (var i in tablas_parseadas){
      opcion.text = tablas_parseadas[i].nombre;
      desplegable_tablas.options[desplegable_tablas.options.length] = new Option(opcion.text, i);
    }
  });
}

function getFormularioElegido(nombre){
  return new Promise(resolve => {
    let request = new XMLHttpRequest();
    let params = "http://localhost:49787/XMLs/";

    request.open("GET", params + nombre + ".xml", true);

    request.onreadystatechange = function() {
      if (request.readyState == 4 && request.status == 200) {
        formulario_activo = request.responseXML;
        resolve(request.responseXML);
      }
    };
    request.send();
  });
}

function getTablas(){
  return new Promise(resolve => {
    let request = new XMLHttpRequest();
    let params = "http://localhost:49787/api/BBDD/";
    
    request.onreadystatechange = function() {
      if (request.readyState == 4 && request.status == 200) {
        resolve(request.responseText);
      }
    };
    
    request.open("GET", params, true)
    request.send();
  })
}

function getAtributos(indice){
  return new Promise(resolve => {
    let request = new XMLHttpRequest();
    let params = "http://localhost:49787/api/BBDD/";
    
    request.onreadystatechange = function() {
      if (request.readyState == 4 && request.status == 200) {
        resolve(request.responseText);
      }
    };
    
    request.open("GET", params + indice, true)
    request.send();
  })
}

function limpiaDesplegableCampos(){
  for (var i = 1; i < desplegable_campos.length; i++){
    desplegable_campos.remove(i);
  }
}

//asigna el campo seleccionado al atributo y la tabla, si procede.
function realizaAsignacion(){

  let tablas_formulario = formulario_modificado.getElementsByTagName("tabla");
  let campos_formulario = tablas_formulario[0].getElementsByTagName("campo");
  let nombre_campo;
  //Si algun valor no está seleccionado entonces...
  if (desplegable_campos.value == "inicial" || desplegable_tablas.value == "inicial" || desplegable_atributos.value == "inicial"){
    info_asignacion.innerText = "Debe seleccionar un valor correcto en cada desplegable.";
  } else {
    configurar.disabled = true;
    nombre_campo = desplegable_campos.selectedIndex.text;

    if (tablas_formulario.length == 1){//Si en el form solo hay una tabla, entonces no se permite cambiar de tabla durante la asignación.
      if (tablas_formulario[0].attributes.getNamedItem("valor").value == "no definida"){
        tablas_formulario[0].attributes.getNamedItem("valor").value = desplegable_tablas.options[desplegable_tablas.selectedIndex].text;//CADENA SELECCIONADA;
      }
      desplegable_tablas.disabled = true;
      campos_formulario = tablas_formulario[0].getElementsByTagName("campo");
    }

    for (var i = 0; i < campos_formulario.length; i++){
      if (campos_formulario[i].getElementsByTagName("descripcion")[0].childNodes[0].nodeValue == desplegable_campos.options[desplegable_campos.selectedIndex].text){//CADENA DEL CAMPO SELECCIONADO){
        campos_formulario[i].getElementsByTagName("atributo")[0].childNodes[0].nodeValue = desplegable_atributos.options[desplegable_atributos.selectedIndex].text;//CADENA DEL ATRIBUTO SELECCIONADO;
        i = campos_formulario.length;

        desplegable_campos.remove(desplegable_campos.selectedIndex);

        if (desplegable_campos.length == 1 && desplegable_campos.value == "inicial"){ //Si formulario configurado, guarda en local (storage)
          
          autorrellenar.disabled = false;
          asignar.disabled = true;

          chrome.storage.local.set({[forms.value] : new XMLSerializer().serializeToString(formulario_modificado)}, function() { //guarda el form configurado en la extensión.
            alert("formulario guardado");
          });

          info_asignacion.innerText = "Formulario configurado.";
          formularios_msg.innerText = "Listo para rellenar.";

        } else {
          info_asignacion.innerText = "Asignacion correcta al campo " + nombre_campo +".";
          //alert(new XMLSerializer().serializeToString(formulario_activo));
          //alert(new XMLSerializer().serializeToString(formulario_modificado));
        }
      }
    }
  }  
}

//Estudiar posibilidad de colocar login en una ventana y lo restante despues.

//COLOCAR TODO EN UNA MISMA BASE DE DATOS.
//TABLA USUARIOS CON ID, CONTRASEÑA...
//TABLA FORMULARIOS:
//ID USUARIO
//TIMESTAMP
//MD5SUM
//URL
//IDFORM
//RUTA DE ARCHIVO XML
//LEE LA CADENA DE CONEXION A LA BBDD Y SE CONECTA A ELLA, TODO EN EL SERVIDOR WEB.