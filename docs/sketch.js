let alcada_tecla_blanca = 0.0;
let amplada_tecla_blanca = 0.0;
let alcada_tecla_negra = 0.0;
let amplada_tecla_negra = 0.0;
let tecles = {};
let midiData = null;
let midiSuccess = false;
let sonantara = [];
let millisbase = null;
let notesmaesquerra = null;
let notesmadereta = null;

function setup(){
    createCanvas(windowWidth, windowHeight);
    background(0);    
    preparaTecles();
    calculaTecles();
    MidiStart();
    loadMidiFile();
    millisbase = millis();
}

function draw(){
    //MidiStart();
    background(0);
    noStroke();
    pintaNotes();
    pintaTecles();
    pintaUsb();
}

function windowResized(){
    resizeCanvas(windowWidth, windowHeight);
    calculaTecles();
}

/* -- Midi File -- 

https://github.com/Tonejs/MidiConvert

*/

function loadMidiFile()
{   
    url = new URL(location);
    file = url.searchParams.get("midi"); // "./River_Flows_In_You.mid";
    MidiConvert.load(file, loadMidiFile2 );
}

function loadMidiFile2(midi) {
    // si té dos tracks: 1 -> ma esquerra, 2 -> ma dereta
    numerodetracks = midi.tracks.length;
    if ( numerodetracks < 2 || numerodetracks > 3 ) console.log("midi no suportart. Ha de tenir 2 o 3 trakcs");
    primertrack = numerodetracks == 2 ? 0 : 1; 
    
    notesmaesquerra = midi.tracks[0 + primertrack].notes;
    notesmadereta = midi.tracks[1 + primertrack].notes;
}

/* -- MIDI Controller -- */

// start talking to MIDI controller
function MidiStart()
{
    if (midiSuccess ) return;
    noLoop();
    if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({
      sysex: false
    }).then(onMIDISuccess, onMIDIFailure);
  } else {
    console.warn("No MIDI support in your browser")
  }
}


// on success
function onMIDISuccess(midiDataParm) {
  // this is all our MIDI data
  midiData = midiDataParm;
  let allInputs = midiData.inputs.values();
  // loop over all available inputs and listen for any MIDI input
  for (let input = allInputs.next(); input && !input.done; input = allInputs.next()) {
    // when a MIDI value is received call the onMIDIMessage function
    input.value.onmidimessage = gotMIDImessage;
  }
  loop();
}

function gotMIDImessage(messageData) {
    midiSuccess = true;
    console.info(messageData);
    if ( messageData.data[0] == 144 )
    {
        console.info("tecla");
        tecles[ messageData.data[1] ].estapremuda = ( messageData.data[2] != 0 );
    }        
}

// on failure
function onMIDIFailure() {
  console.warn("Not recognising MIDI controller");
  loop();
}

/* --- END MIDI Controller-- */



/* ---- Helpers ---- */

function preparaTecles(i)
{
    negresoffset = { 1: null, 3: null, 6: null, 8: null, 10: null  };

    // 21 a 108
    pos = -1;
    for (let i = 21; i <= 108; i++)
    {
        notaabsoluta = ( i % 12 );
        esnegra = notaabsoluta in negresoffset;
        if (!esnegra) pos++;
        tecles[i] = { esnegra: esnegra,
                      displaynum: pos,
                      notaabsoluta: notaabsoluta,
                      estapremuda: false,
                      desplacamentesquerra: null,
                      desplacamentbaix: null,
                      strokeWeight: null,
                      fill: null,
                      particles: null
                    }
    }
}

function calculaTecles()
{
    numblanques = Object.values(tecles).filter((obj) => !obj.esnegra).length;

    // tamanys
    amplada_tecla_blanca = windowWidth / numblanques;
    alcada_tecla_blanca = amplada_tecla_blanca * 7;
    amplada_tecla_negra = 0.8 * amplada_tecla_blanca;
    alcada_tecla_negra = (4/6) * alcada_tecla_blanca;
    delta_negra = alcada_tecla_blanca - alcada_tecla_negra;

    // offset negres
    negresoffset = { 
        0: 0,
        1: 1/2 * amplada_tecla_blanca, 
        2: 0,
        3: 1.5 * amplada_tecla_blanca - amplada_tecla_negra,
        4: 0,
        5: 0,
        6: 1/2 * amplada_tecla_blanca, 
        7: 0,
        8: amplada_tecla_blanca - 0.5 * amplada_tecla_negra,
        9: 0,
        10: 1.5 * amplada_tecla_blanca - amplada_tecla_negra,
        11: 0  };

    // final
    for (let i = 21; i <= 108; i++)
    {
        tecles[i].desplacamentesquerra = negresoffset[ tecles[i].notaabsoluta ];
        tecles[i].desplacamentbaix = tecles[i].esnegra ? delta_negra : 0 ;
        tecles[i].strokeWeight = tecles[i].esnegra ? 2 : 2 ;
        tecles[i].fill = tecles[i].esnegra ? 12 : 255 ;
        strokeWeight
    }

}

function pintaTecles(i)
{
    stroke('rgb(0,255,0)');
    //pinta blanques
    for (let i = 21; i <= 108; i++)
    {
        //tecla
        tecla = tecles[i];

        //guies
        strokeWeight(1);
        stroke("#A0A0A0");
        if (tecla.notaabsoluta==0 || tecla.notaabsoluta==5 )
        {
            line( tecla.displaynum * amplada_tecla_blanca, 0, tecla.displaynum * amplada_tecla_blanca, windowHeight );
        }

        //tecles
        if (tecla.esnegra) continue;
        fill( tecla.estapremuda ? ( sonantara.includes(i) ? '#00FF00' : '#FF0000') 
                                : ( sonantara.includes(i) ? '#404040' : tecla.fill ));
        strokeWeight( tecla.strokeWeight)
        rect( tecla.displaynum * amplada_tecla_blanca + tecla.desplacamentesquerra, 
              windowHeight - tecla.desplacamentbaix , 
              tecla.esnegra ? amplada_tecla_negra : amplada_tecla_blanca, 
              tecla.esnegra ? -alcada_tecla_negra : -alcada_tecla_blanca);
    }

    //pinta negres
    for (let i = 21; i <= 108; i++)
    {
        tecla = tecles[i];
        if (!tecla.esnegra) continue;
        fill( tecla.estapremuda ? ( sonantara.includes(i) ? '#00FF00' : '#FF0000') 
                                : ( sonantara.includes(i) ? '#404040' : tecla.fill ));
        strokeWeight( tecla.strokeWeight)
        rect( tecla.displaynum * amplada_tecla_blanca + tecla.desplacamentesquerra, 
              windowHeight - tecla.desplacamentbaix , 
              tecla.esnegra ? amplada_tecla_negra : amplada_tecla_blanca, 
              tecla.esnegra ? -alcada_tecla_negra : -alcada_tecla_blanca);
    }

}

function pintaNotes()
{
    stroke(1);

    sonantara = [];
    if (notesmaesquerra != null ) notesmaesquerra.forEach( x => pintaNota(x, false, true ) );
    if (notesmadereta != null ) notesmadereta.forEach( x => pintaNota(x, false, false) );
    if (notesmaesquerra != null ) notesmaesquerra.forEach( x => pintaNota(x, true, true) );
    if (notesmadereta != null ) notesmadereta.forEach( x => pintaNota(x, true, false) );

}

function pintaNota (nota, lesnegres, esmaesquerra ) {
    if (nota.midi in tecles)
    {
        rati = 0.25;
        tecla = tecles[nota.midi];
        if (tecla.esnegra != lesnegres ) return;
        colornota = !esmaesquerra ?
        ( lesnegres ? "#0000ff" : "#2020f0" ) :
        ( lesnegres ? "#00ff00" : "#20f020" ) ;
        fill( colornota );
        base = rati * ( currentMillis() - (nota.time * 1000) );
        alcada = rati * (nota.duration * 1000);

        strokeWeight(0);
        stroke(colornota);
        rect( tecla.displaynum * amplada_tecla_blanca + tecla.desplacamentesquerra, 
            base-alcada, 
            tecla.esnegra ? amplada_tecla_negra : amplada_tecla_blanca, 
            alcada,
            lesnegres ? 10 : 2 ) ;
        
        //pinta nom de la nota
        //strokeWeight(0);
        //fill("#FFFFFF");
        //textSize( amplada_tecla_blanca / 2 );
        //textAlign(LEFT, BOTTOM);
        //text( nota.name, tecla.displaynum * amplada_tecla_blanca + tecla.desplacamentesquerra, base ) ;
    
        //comprovo si està sonant:
        estasonant = base-alcada <= ( windowHeight-alcada_tecla_blanca )  
                     && ( windowHeight-alcada_tecla_blanca ) <= (base);
        if (estasonant) 
        {
            sonantara.push(nota.midi);
        }
    }
}

function pintaUsb()
{
    textSize(20);
    textAlign(RIGHT, TOP);
    fill( !midiSuccess ? "#FF0000" : "#00FF00" ) ;
    stroke( !midiSuccess ? "#FF0000" : "#00FF00" ) ;
    text( !midiSuccess ?  "- USB: connecta USB i prem ctrl-F5 -" : "* USB *", windowWidth - 1, 1);   
}

function currentMillis()
{ 
    return millis() - millisbase;
}