#!/usr/bin/env python3
"""Gera trilhas originais discretas, sem samples externos, e um impacto curto."""
from pathlib import Path
import json
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
RATE = 44100

def save(name, data, duration):
    folder = ROOT/'sounds'/name
    folder.mkdir(parents=True, exist_ok=True)
    if np.max(np.abs(data)) > 0.95: raise ValueError('Clipping')
    pcm = np.round(np.column_stack((data, data))*32767).astype('<i2')
    with wave.open(str(folder/(name+'.wav')), 'wb') as stream:
        stream.setnchannels(2); stream.setsampwidth(2); stream.setframerate(RATE)
        stream.writeframes(pcm.tobytes())
    meta = {'$GMSound':'v2','%Name':name,'name':name,'audioGroupId':{'name':'audiogroup_default','path':'audiogroups/audiogroup_default'},
            'bitDepth':1,'channelFormat':2,'compression':1,'compressionQuality':4,'conversionMode':0,'duration':duration,'exportDir':'',
            'parent':{'name':'Audio','path':'folders/Audio.yy'},'preload':False,'resourceType':'GMSound','resourceVersion':'2.0',
            'sampleRate':RATE,'soundFile':name+'.wav','volume':1.0}
    (folder/(name+'.yy')).write_text(json.dumps(meta,indent=2)+'\n')

for name, pulse in [('Snd_tensao',0.5),('Snd_combate',1.5)]:
    duration = 16
    t = np.arange(RATE*duration)/RATE
    # Frequências fecham um número inteiro de ciclos para o loop não estalar.
    bed = 0.19*np.sin(2*np.pi*48*t) + 0.10*np.sin(2*np.pi*72*t) + 0.05*np.sin(2*np.pi*96.25*t)
    envelope = (0.5-0.5*np.cos(2*np.pi*pulse*t))**8
    metal = 0.07*np.sin(2*np.pi*181.5*t) + 0.04*np.sin(2*np.pi*263.25*t)
    data = bed*(0.68+0.12*np.cos(2*np.pi*t/16)) + envelope*(0.14*np.sin(2*np.pi*61*t)+metal)
    save(name,data,duration)

duration = 0.65
t = np.arange(round(RATE*duration))/RATE
rng = np.random.default_rng(42)
noise = np.convolve(rng.uniform(-1,1,len(t)),np.ones(12)/12,mode='same')
data = (0.50*np.sin(2*np.pi*(82*t-27*t*t)) + 0.45*noise)*np.exp(-8*t)*np.minimum(1,t/0.008)
data *= np.minimum(1,(duration-t)/0.025)
save('Snd_impacto_boss',data,duration)
print('3 recursos de áudio gerados; pico abaixo de 0 dBFS, loops periódicos de 16 s.')
