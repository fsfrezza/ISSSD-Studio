def rd(a):return ram[a]|ram[a+1]<<8
def wr(a,v):ram[a]=v&255;ram[a+1]=(v>>8)&255
load('live');run(30)
k=int(__import__('os').environ.get('KEEPER','0x500'),0)
raw=rom.read_bytes()
wr(k+0x32,0x608);wr(k+0x30,1);wr(k+0x70,18)
for i,off in enumerate([0x90,0x92,0x94,0x60]):wr(k+off,int.from_bytes(raw[0xBD58+0x608+i*2:0xBD58+0x60A+i*2],'little'))
wr(0xC8,k);wr(0x11FA,0x40);wr(0x430,0xE)
for a,b in [(0x40A,k+0x2A),(0x40C,k+0x2C)]:wr(a,rd(b))
core.retro_get_memory_data.restype=C.POINTER(C.c_uint8)
sram=core.retro_get_memory_data(0)
slot=0x1800+(0 if k==0x500 else 8)
for off,v in [(0,0xBACC),(2,k+0x100),(4,2)]:sram[slot+off]=v&255;sram[slot+off+1]=v>>8
print('ARMED',hex(k),hex(rd(0x70)),hex(rd(k+0x2A)),hex(rd(k+0x2C)),hex(rd(0xE8)),flush=True)
seen=False;released=False;penalty=False;last=None
for n in range(2400):
 if n>800 and rd(0xC0) in (4,5):buttons.update([(0,9),(1,9)])
 if n%60==0:buttons.clear()
 run()
 state=tuple(rd(a)for a in [0x70,0xBA,0xBC,0xC0,0xC2,0x11E8,0xC8,0x430])
 if state!=last and(n<5 or n>800):print('STEP',n,*(hex(v)for v in state),flush=True);last=state
 if rd(0xC0) in (4,5):seen=True
 if rd(0xC2)==6:penalty=True
 if seen and rd(0xC0)==0 and rd(0xBA)==0 and rd(0xBC)==0:released=True
 if n in (800,1200,2399):shot('armed-'+hex(k)+'-'+str(n))
print('RESULT',seen,released,penalty,flush=True)
assert seen and released and not penalty
