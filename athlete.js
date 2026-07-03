/* Treating the Athlete — hero animation: a tennis player rallying a ball.
   A clean, illustrated figure plants, winds up, and swings a racket through a
   ball that flies out and loops back. Pure canvas 2D, filled shapes. Honors
   prefers-reduced-motion with a single static contact pose. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var C = { skin:'#F2C89B', shirt:'#5CB338', shorts:'#2E7D32', limb:'#2E7D32', limbBack:'#3E8E43',
            racket:'#14532D', grip:'#C7E84B', string:'rgba(20,83,45,0.5)', ball:'#D6EE4B', ballLine:'rgba(20,83,45,0.55)',
            court:'rgba(46,125,50,0.16)', line:'rgba(92,179,56,0.5)', shadow:'rgba(20,83,45,0.10)' };

  function smooth(x){ x = Math.max(0, Math.min(1, x)); return x*x*(3-2*x); }
  function lerp(a,b,t){ return a+(b-a)*t; }
  function ang(o, a, r){ return { x:o.x+Math.cos(a)*r, y:o.y+Math.sin(a)*r }; }

  function init(canvas){
    if(!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    var W=0,H=0,cx=0,S=1,groundY=0,cur=0,target=0;

    function resize(){
      var r = canvas.getBoundingClientRect(); W=r.width; H=r.height; if(!W||!H) return;
      canvas.width=Math.round(W*DPR); canvas.height=Math.round(H*DPR); ctx.setTransform(DPR,0,0,DPR,0,0);
      S = Math.min(H*0.80, W*0.62);          // player height scale
      cx = W*0.40; groundY = H*0.50 + S*0.44;
    }
    if(!reduce){
      canvas.addEventListener('pointermove', function(e){ var r=canvas.getBoundingClientRect(); target=((e.clientX-r.left)/r.width-0.5)*18; });
      canvas.addEventListener('pointerleave', function(){ target=0; });
    }

    function limb(a,b,w,col){ ctx.strokeStyle=col; ctx.lineWidth=w; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }

    function draw(t){
      if(!W||!H) return;
      cur += (target-cur)*0.06;
      ctx.clearRect(0,0,W,H);
      var ox = cx + cur;
      var u = reduce ? 0.60 : ((t*0.00040) % 1);      // swing cycle 0..1

      // court
      ctx.strokeStyle=C.court; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(W*0.06,groundY+2); ctx.lineTo(W*0.94,groundY+2); ctx.stroke();
      ctx.strokeStyle=C.line; ctx.lineWidth=2.5; ctx.setLineDash([2,14]); ctx.beginPath(); ctx.moveTo(W*0.1,groundY+2); ctx.lineTo(W*0.9,groundY+2); ctx.stroke(); ctx.setLineDash([]);

      // ---- figure geometry (player faces right) ----
      var hip = { x:ox, y:groundY - S*0.46 };
      var lean = -1.35;                                 // torso up + slight right lean
      var shoulder = ang(hip, lean+0.06, S*0.34);
      var neck = ang(hip, lean+0.05, S*0.40);
      var head = ang(neck, lean, S*0.10);
      var headR = S*0.075;
      var sway = Math.sin(u*6.283)*S*0.02;              // subtle weight shift

      // legs: athletic split stance
      var frontHip={x:hip.x+S*0.02,y:hip.y}, backHip={x:hip.x-S*0.02,y:hip.y};
      var frontKnee = ang(frontHip, 0.55, S*0.24), frontAnkle = ang(frontKnee, 0.22, S*0.24);
      var backKnee  = ang(backHip, 2.5, S*0.24),  backAnkle  = ang(backKnee, 2.95, S*0.24);
      frontAnkle.y=Math.min(frontAnkle.y,groundY); backAnkle.y=Math.min(backAnkle.y,groundY);

      // racket arm swing: windup (u<0.45) -> strike through contact (~0.58) -> follow-through -> reset
      var aStart=3.7, aBack=4.5, aFollow=1.0;
      var armA;
      if(u<0.42) armA = lerp(aStart,aBack, smooth(u/0.42));
      else if(u<0.72) armA = lerp(aBack, aFollow, smooth((u-0.42)/0.30));
      else armA = lerp(aFollow, aStart+6.283, smooth((u-0.72)/0.28)) ;
      var armLen=S*0.30;
      var rShoulder={x:shoulder.x+S*0.02,y:shoulder.y};
      var hand = ang(rShoulder, armA, armLen);
      // balance (left) arm
      var lElbow = ang(shoulder, 2.7, S*0.14), lHand = ang(lElbow, 2.2, S*0.14);

      // racket at hand, extending along the arm line
      var rdir = armA;
      var headCtr = ang(hand, rdir, S*0.16);
      var rw=S*0.115, rh=S*0.155;

      // ---- ball path synced to contact at u=0.58 ----
      var contact = ang(hand, rdir, S*0.13);
      var trail=[];
      function ballAt(uu){
        if(uu<=0.58){ var k=smooth(uu/0.58); return { x:lerp(W*0.86, contact.x, k), y:lerp(H*0.16, contact.y, k*k) }; }
        var k2=(uu-0.58)/0.42; var x=lerp(contact.x, W*0.98, k2); var y=lerp(contact.y, H*0.10, k2) + Math.sin(k2*3.14)* -S*0.10; return {x:x,y:y};
      }
      if(!reduce){ for(var i=6;i>=1;i--){ var uu=u - i*0.012; if(uu<0)uu+=1; trail.push(ballAt(uu)); } }
      var ball = ballAt(u);
      var br = S*0.045;

      // ---- draw: shadow ----
      ctx.fillStyle=C.shadow; ctx.beginPath(); ctx.ellipse(ox, groundY+2, S*0.24, S*0.05, 0, 0, 6.283); ctx.fill();

      // back leg + back (balance) arm behind body
      limb(backHip, backKnee, S*0.075, C.limbBack); limb(backKnee, backAnkle, S*0.062, C.limbBack);
      limb(shoulder, lElbow, S*0.05, C.limbBack); limb(lElbow, lHand, S*0.045, C.limbBack);

      // torso
      limb(hip, shoulder, S*0.12, C.shirt);
      // front leg
      limb(frontHip, frontKnee, S*0.08, C.shorts); limb(frontKnee, frontAnkle, S*0.066, C.limb);
      // shoes
      ctx.fillStyle=C.limb; [frontAnkle,backAnkle].forEach(function(a,idx){ ctx.beginPath(); ctx.ellipse(a.x+S*0.03, a.y, S*0.055, S*0.028, 0,0,6.283); ctx.fill(); });

      // head
      ctx.fillStyle=C.skin; ctx.beginPath(); ctx.arc(head.x, head.y, headR, 0, 6.283); ctx.fill();

      // ball trail
      if(!reduce){ trail.forEach(function(p,i){ ctx.globalAlpha=0.06+0.05*i; ctx.fillStyle=C.ball; ctx.beginPath(); ctx.arc(p.x,p.y,br*0.85,0,6.283); ctx.fill(); }); ctx.globalAlpha=1; }

      // racket arm (front) + racket
      limb(rShoulder, hand, S*0.055, C.limb);
      // racket: handle + frame + strings
      limb(hand, headCtr, S*0.03, C.grip);
      ctx.save(); ctx.translate(headCtr.x, headCtr.y); ctx.rotate(rdir+1.57);
      ctx.strokeStyle=C.racket; ctx.lineWidth=S*0.028; ctx.beginPath(); ctx.ellipse(0,0,rw,rh,0,0,6.283); ctx.stroke();
      ctx.strokeStyle=C.string; ctx.lineWidth=1.1;
      for(var g=-2;g<=2;g++){ ctx.beginPath(); ctx.moveTo(g*rw/2.6,-rh*0.86); ctx.lineTo(g*rw/2.6,rh*0.86); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-rw*0.86,g*rh/2.6); ctx.lineTo(rw*0.86,g*rh/2.6); ctx.stroke(); }
      ctx.restore();

      // ball
      var g2=ctx.createRadialGradient(ball.x-br*0.3,ball.y-br*0.3,1,ball.x,ball.y,br);
      g2.addColorStop(0,'#EEF7A6'); g2.addColorStop(1,C.ball);
      ctx.fillStyle=g2; ctx.beginPath(); ctx.arc(ball.x,ball.y,br,0,6.283); ctx.fill();
      ctx.strokeStyle=C.ballLine; ctx.lineWidth=1.3; ctx.beginPath(); ctx.arc(ball.x,ball.y,br,-0.5,2.4); ctx.stroke();
    }

    var raf;
    function loop(t){ draw(t); raf=requestAnimationFrame(loop); }
    function start(){ resize(); if(reduce){ draw(0); return; } cancelAnimationFrame(raf); raf=requestAnimationFrame(loop); }
    var rt;
    window.addEventListener('resize', function(){ clearTimeout(rt); rt=setTimeout(function(){ resize(); if(reduce) draw(0); }, 120); });
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if(reduce) draw(0); });
    start();
  }

  init(document.getElementById('athlete-canvas'));
  init(document.getElementById('move-canvas'));
})();
