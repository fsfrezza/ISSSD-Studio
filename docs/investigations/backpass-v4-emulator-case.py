load('clean-advance');press(3);run(30)
sram=core.retro_get_memory_data(0)
for k in range(0x1800,0x1810):sram[k]=0
w=lambda a:ram[a]|ram[a+1]<<8
def put(a,v):ram[a]=v&255;ram[a+1]=(v>>8)&255
keeper=0x500
rombytes=rom.read_bytes()
put(keeper+0x32,0x10)
for j,field in enumerate([0x90,0x92,0x94,0x60]):put(keeper+field,int.from_bytes(rombytes[0xBD68+j*2:0xBD6A+j*2],'little'))
for a in [0xba,0xbc,0xc0,0xc2,0xd0,0xa6,0xa4,0x410,0x40e,0x422,0x424,0x426,0x428,0x434,0x436,0x11fa,keeper+0x1e,keeper+0x20,keeper+0x3e]:put(a,0)
put(keeper+0x6c,w(keeper+0x6c)&0x7fff)
for o in [6,8,10,12,0x2a,0x2c]:put(0x400+o,w(keeper+o))
put(0xc8,0x600);put(0x430,1);put(0x12f4,2)
controller=0x1aa0
old=w(controller+0x2c);put(old+0x6e,w(old+0x6e)&~0x80)
put(controller+0x2c,keeper);put(keeper+0x6e,w(keeper+0x6e)|0x80);put(0xda8,1)

put(0x408,w(keeper+8)+16);put(0x410,-32);put(0x424,0xffff)
# First let native contact process the teammate's grounded backpass.
foot=None
for i in range(160):
 if i==0:buttons.add((0,8))
 if i==5:buttons.clear()
 run(1)
 if w(0xC8)==keeper and w(0x12A0)==0x600:
  foot=i;print('FIRST_TOUCH',i,hex(w(0x12F4)),hex(w(0xA6)),flush=True);break
assert foot is not None
buttons.clear();run(30)
# Arrange the next trajectory for a manual catch. Touch provenance is untouched.
put(keeper+0x32,0x10)
for j,field in enumerate([0x90,0x92,0x94,0x60]):put(keeper+field,int.from_bytes(rombytes[0xBD68+j*2:0xBD6A+j*2],'little'))
for a in [keeper+0x1e,keeper+0x20,keeper+0x3e,0xa6,0xa4,0x40e,0x422,0x426,0x428,0x434,0x436,0x11fa]:put(a,0)
put(keeper+0x6e,w(keeper+0x6e)&~0x400)
put(0x406,w(keeper+6));put(0x40a,w(keeper+0xa));put(0x408,w(keeper+8)+16);put(0x40c,w(keeper+0xc));put(0x410,-48);put(0x424,0xffff)
put(controller+0x2c,keeper)
print('BEFORE_B',hex(w(0xC8)),hex(w(0x12A0)),hex(w(0x12F4)),flush=True)
last=None;capture=None;standing=None;penalty=None
for i in range(800):
 if i==0:buttons.add((0,8))
 if i==5:buttons.clear()
 run(1)
 state=tuple(w(a) for a in [keeper+0x32,0xA6,0xC8,0x12A0,keeper+0x78,0x12F4,0x11FA,0xBA,0xC2,keeper+0xA8,keeper+0xAA,keeper+0xAC])
 if state!=last:print('REPRO',i,*[hex(v) for v in state],flush=True);last=state
 if w(0xA6)==keeper and w(0x12F4)==0xE and capture is None:capture=i
 if w(keeper+0x32)==0x608 and standing is None:standing=i
 if w(0xBA)==0x7f01 and penalty is None:penalty=i
 if i in [0,20,40,80,120,300,600]:frame.save(root/('manual-repro-'+str(i)+'.png'))
print('REPRO_RESULT',foot,capture,standing,penalty,flush=True)
