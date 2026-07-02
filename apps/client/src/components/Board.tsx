import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Player, Token, PlayerColor } from "@repo/shared";
import { cn } from "@/lib/utils";

interface Props {
  players: Player[];
  currentPlayerId: string | null;
  diceRolled: boolean;
  isMyTurn: boolean;
  myPlayerColor: PlayerColor | null;
  onTokenClick: (tokenId: string) => void;
}

const C = {
  RED:"#e63946", GREEN:"#2dc653", YELLOW:"#f9c74f", BLUE:"#4361ee",
  RED_L:"#f4a0a8", GREEN_L:"#a8e6bc", YELLOW_L:"#fde99a", BLUE_L:"#a8bff4",
  RED_D:"#c1121f", GREEN_D:"#1a7a36", YELLOW_D:"#e0a800", BLUE_D:"#2440c4",
};

const PATH_CELLS: [number,number][] = [
  [6,1],[6,2],[6,3],[6,4],[6,5],
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
  [0,7],[0,8],
  [1,8],[2,8],[3,8],[4,8],[5,8],
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  [7,14],[8,14],
  [8,13],[8,12],[8,11],[8,10],[8,9],
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  [14,7],[14,6],
  [13,6],[12,6],[11,6],[10,6],[9,6],
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  [7,0],[6,0],
];

const HOME_COL: Record<PlayerColor,[number,number][]> = {
  RED:    [[7,1],[7,2],[7,3],[7,4],[7,5]],
  GREEN:  [[1,7],[2,7],[3,7],[4,7],[5,7]],
  YELLOW: [[7,13],[7,12],[7,11],[7,10],[7,9]],
  BLUE:   [[13,7],[12,7],[11,7],[10,7],[9,7]],
};

const YARD_SLOTS: Record<PlayerColor,[number,number][]> = {
  RED:    [[1,1],[1,3],[3,1],[3,3]],
  GREEN:  [[1,10],[1,12],[3,10],[3,12]],
  YELLOW: [[10,10],[10,12],[12,10],[12,12]],
  BLUE:   [[10,1],[10,3],[12,1],[12,3]],
};

const HOME_COL_TINT: Record<PlayerColor,string> = {
  RED:"#f4a0a8", GREEN:"#a8e6bc", YELLOW:"#fde99a", BLUE:"#a8bff4",
};

const PATH_TINT: Record<string,string> = {
  "6-1":"#f4a0a8","1-8":"#a8e6bc","8-13":"#fde99a","13-6":"#a8bff4",
};

const SAFE = new Set([1,9,14,22,27,35,40,48]);

const Y: Record<PlayerColor,{main:string;light:string;dark:string}> = {
  RED:    {main:C.RED,   light:C.RED_L,   dark:C.RED_D},
  GREEN:  {main:C.GREEN, light:C.GREEN_L, dark:C.GREEN_D},
  YELLOW: {main:C.YELLOW,light:C.YELLOW_L,dark:C.YELLOW_D},
  BLUE:   {main:C.BLUE,  light:C.BLUE_L,  dark:C.BLUE_D},
};

function getCell(pos: number, color: PlayerColor): [number,number] | null {
  if (pos === 0) return null;
  if (pos >= 53) return HOME_COL[color][pos-53] ?? null;
  return PATH_CELLS[pos-1] ?? null;
}

function getSteps(fromPos: number, toPos: number, color: PlayerColor): [number,number][] {
  const steps: [number,number][] = [];
  if (fromPos === toPos) return steps;
  if (fromPos === 0) {
    const cell = getCell(toPos, color);
    if (cell) steps.push(cell);
    return steps;
  }
  for (let p = fromPos + 1; p <= toPos; p++) {
    const cell = getCell(p, color);
    if (cell) steps.push(cell);
  }
  return steps;
}

export default function Board({
  players, diceRolled, isMyTurn, myPlayerColor, onTokenClick
}: Props) {

  const [prevPositions, setPrevPositions] = useState<Record<string,number>>({});
  const [animatingTokens, setAnimatingTokens] = useState<
    Record<string, { steps: [number,number][]; stepIdx: number; color: PlayerColor }>
  >({});

  useEffect(() => {
    const newPrev: Record<string,number> = {};
    const newAnimating: typeof animatingTokens = {};

    for (const player of players) {
      for (const token of player.tokens) {
        const prev = prevPositions[token.id];
        const curr = token.position;
        newPrev[token.id] = curr;

        if (prev !== undefined && prev !== curr && token.status !== "HOME") {
          const steps = getSteps(prev, curr, player.color as PlayerColor);
          if (steps.length > 1) {
            newAnimating[token.id] = {
              steps,
              stepIdx: 0,
              color: player.color as PlayerColor,
            };
          }
        }
      }
    }

    setPrevPositions(newPrev);
    if (Object.keys(newAnimating).length > 0) {
      setAnimatingTokens(prev => ({ ...prev, ...newAnimating }));
    }
  }, [players]);

  useEffect(() => {
    const hasAnimating = Object.keys(animatingTokens).length > 0;
    if (!hasAnimating) return;

    const timer = setTimeout(() => {
      setAnimatingTokens(prev => {
        const next = { ...prev };
        for (const [id, anim] of Object.entries(next)) {
          if (anim.stepIdx < anim.steps.length - 1) {
            next[id] = { ...anim, stepIdx: anim.stepIdx + 1 };
          } else {
            delete next[id];
          }
        }
        return next;
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [animatingTokens]);

  const tokenMap = useMemo(() => {
    const map = new Map<string,{token:Token;color:PlayerColor;isAnimating?:boolean}[]>();
    const push = (k:string,t:Token,c:PlayerColor,ia?:boolean) => {
      if(!map.has(k)) map.set(k,[]);
      map.get(k)!.push({token:t,color:c,isAnimating:ia});
    };

    for (const player of players) {
      let hi = 0;
      for (const token of player.tokens) {
        const anim = animatingTokens[token.id];

        if (anim) {
          const cell = anim.steps[anim.stepIdx];
          if (cell) push(`p-${cell[0]}-${cell[1]}`, token, player.color as PlayerColor, true);
          continue;
        }

        if (token.status === "HOME" || token.position === 0) {
          const slot = YARD_SLOTS[player.color as PlayerColor][hi % 4]!;
          push(`slot-${slot[0]}-${slot[1]}`, token, player.color as PlayerColor);
          hi++;
        } else if (token.status === "FINISHED") {
          push("center", token, player.color as PlayerColor);
        } else if (token.position >= 53) {
          const col = HOME_COL[player.color as PlayerColor][token.position-53];
          if(col) push(`p-${col[0]}-${col[1]}`, token, player.color as PlayerColor);
        } else {
          const cell = PATH_CELLS[token.position-1];
          if(cell) push(`p-${cell[0]}-${cell[1]}`, token, player.color as PlayerColor);
        }
        if (token.status === "HOME" || token.position === 0) { 
          // already counted hi
        }
        else hi = hi;
      }
    }

    return map;
  }, [players, animatingTokens]);

  const tokenMapFinal = useMemo(() => {
    const map = new Map<string,{token:Token;color:PlayerColor;isAnimating?:boolean}[]>();
    const push = (k:string,t:Token,c:PlayerColor,ia?:boolean) => {
      if(!map.has(k)) map.set(k,[]);
      map.get(k)!.push({token:t,color:c,isAnimating:ia});
    };

    for (const player of players) {
      let hi = 0;
      for (const token of player.tokens) {
        const anim = animatingTokens[token.id];
        if (anim) {
          const cell = anim.steps[anim.stepIdx];
          if (cell) push(`p-${cell[0]}-${cell[1]}`, token, player.color as PlayerColor, true);
        } else if (token.status === "HOME" || token.position === 0) {
          const slot = YARD_SLOTS[player.color as PlayerColor][hi % 4]!;
          push(`slot-${slot[0]}-${slot[1]}`, token, player.color as PlayerColor);
          hi++;
        } else if (token.status === "FINISHED") {
          push("center", token, player.color as PlayerColor);
        } else if (token.position >= 53) {
          const col = HOME_COL[player.color as PlayerColor][token.position-53];
          if(col) push(`p-${col[0]}-${col[1]}`, token, player.color as PlayerColor);
        } else {
          const cell = PATH_CELLS[token.position-1];
          if(cell) push(`p-${cell[0]}-${cell[1]}`, token, player.color as PlayerColor);
        }
      }
    }
    return map;
  }, [players, animatingTokens]);

  function Tok({ token, color, sm, isAnimating }: {
    token:Token; color:PlayerColor; sm?:boolean; isAnimating?:boolean
  }) {
    const canClick = isMyTurn && diceRolled && color===myPlayerColor &&
      token.status!=="FINISHED" && !isAnimating;
    const y = Y[color];
    return (
      <motion.button
        key={token.id}
        layoutId={token.id}
        onClick={() => canClick && onTokenClick(token.id)}
        whileHover={canClick ? {scale:1.3} : {}}
        whileTap={canClick ? {scale:0.85} : {}}
        disabled={!canClick || !!isAnimating}
        animate={isAnimating ? {
          scale:[1,1.2,1],
          y:[0,-3,0],
        } : {}}
        transition={isAnimating
          ? {duration:0.15,ease:"easeInOut"}
          : {type:"spring",stiffness:200,damping:22}}
        className={cn("rounded-full flex-shrink-0 relative",sm?"w-3 h-3":"w-5 h-5")}
        style={{
          background:`radial-gradient(circle at 35% 30%,${y.light},${y.main} 60%,${y.dark})`,
          border:`2px solid ${y.dark}`,
          boxShadow:canClick
            ?`0 0 0 2px #fbbf24,0 0 10px #fbbf2488,0 2px 4px rgba(0,0,0,0.4)`
            :`0 2px 4px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.5)`,
        }}
      >
        <div className="absolute rounded-full bg-white opacity-50"
          style={{width:"35%",height:"35%",top:"12%",left:"18%"}}/>
      </motion.button>
    );
  }

  function Tokens({k,sm}:{k:string;sm?:boolean}) {
    const list = tokenMapFinal.get(k) ?? [];
    if (!list.length) return null;
    return (
      <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-0.5 z-10 p-0.5">
        {list.map(({token,color,isAnimating}) => (
          <Tok key={token.id} token={token} color={color}
            sm={sm||list.length>2} isAnimating={isAnimating}/>
        ))}
      </div>
    );
  }

  type CellDesc =
    |{k:"yard-border";color:PlayerColor}
    |{k:"yard-inner";color:PlayerColor}
    |{k:"yard-slot";color:PlayerColor;key:string}
    |{k:"path";pos:number;safe:boolean;tint?:string}
    |{k:"homecol";color:PlayerColor}
    |{k:"center"}
    |{k:"empty"};

  const grid = useMemo(():(CellDesc&{r:number;c:number})[][] => {
    const g:(CellDesc&{r:number;c:number})[][]=Array.from({length:15},(_,r)=>
      Array.from({length:15},(_,c)=>({k:"empty" as const,r,c}))
    );
    const yards:[PlayerColor,number,number,number,number][]=[
      ["RED",0,0,5,5],["GREEN",0,9,5,14],
      ["YELLOW",9,9,14,14],["BLUE",9,0,14,5],
    ];
    for(const [color,r0,c0,r1,c1] of yards){
      for(let r=r0;r<=r1;r++) for(let c=c0;c<=c1;c++)
        g[r]![c]={k:"yard-border",color,r,c};
      for(let r=r0+1;r<=r1-1;r++) for(let c=c0+1;c<=c1-1;c++)
        g[r]![c]={k:"yard-inner",color,r,c};
      for(const [sr,sc] of YARD_SLOTS[color])
        g[sr]![sc]={k:"yard-slot",color,key:`slot-${sr}-${sc}`,r:sr,c:sc};
    }
    PATH_CELLS.forEach(([r,c],i)=>{
      const pos=i+1;
      g[r]![c]={k:"path",pos,safe:SAFE.has(pos),tint:PATH_TINT[`${r}-${c}`],r,c};
    });
    for(const [color,cols] of Object.entries(HOME_COL) as [PlayerColor,[number,number][]][])
      for(const [r,c] of cols)
        g[r]![c]={k:"homecol",color,r,c};
    g[7]![7]={k:"center",r:7,c:7};
    return g;
  },[]);

  return (
    <div className="w-full max-w-[min(580px,100vw-16px)] mx-auto select-none">
      <div className="w-full aspect-square rounded-xl overflow-hidden"
        style={{
          padding:"clamp(4px,1.5vw,8px)",
          background:"linear-gradient(145deg,#e8a84a,#b5721a,#8B5e10)",
          boxShadow:"0 8px 32px rgba(0,0,0,0.3),0 2px 8px rgba(0,0,0,0.15)",
        }}>
        <div className="w-full h-full rounded overflow-hidden"
          style={{
            display:"grid",
            gridTemplateColumns:"repeat(15,1fr)",
            gridTemplateRows:"repeat(15,1fr)",
            border:"2px solid #7a5010",
          }}>
          {grid.map(row=>row.map(cell=>{
            const ck=`${cell.r}-${cell.c}`;
            if(cell.k==="yard-border") return(
              <div key={ck} style={{background:Y[cell.color].main,border:`0.5px solid ${Y[cell.color].dark}`}}/>
            );
            if(cell.k==="yard-inner") return(
              <div key={ck} style={{background:"#fff",border:`0.5px solid ${Y[cell.color].main}44`}}/>
            );
            if(cell.k==="yard-slot") return(
              <div key={ck} className="relative flex items-center justify-center"
                style={{background:Y[cell.color].main}}>
                <div className="absolute rounded-full"
                  style={{inset:"6%",background:Y[cell.color].dark,opacity:0.35}}/>
                <div className="absolute rounded-full"
                  style={{inset:"14%",background:"#fff",
                    boxShadow:"inset 0 2px 6px rgba(0,0,0,0.2)"}}/>
                <Tokens k={cell.key}/>
              </div>
            );
            if(cell.k==="path") return(
              <div key={ck} className="relative flex items-center justify-center"
                style={{background:cell.tint??"#fff",border:"0.5px solid #e0d5c0"}}>
                {cell.safe&&(
                  <span className="absolute select-none pointer-events-none z-0"
                    style={{
                      fontSize:"clamp(8px,1.2vw,14px)",
                      color:cell.tint?"#7c3aed":"#4f46e5",
                      fontWeight:900,opacity:1,
                      textShadow:"0 1px 3px rgba(0,0,0,0.2)",
                    }}>★</span>
                )}
                <Tokens k={`p-${cell.r}-${cell.c}`}/>
              </div>
            );
            if(cell.k==="homecol") return(
              <div key={ck} className="relative flex items-center justify-center"
                style={{background:HOME_COL_TINT[cell.color],border:"0.5px solid #e0d5c0"}}>
                <Tokens k={`p-${cell.r}-${cell.c}`}/>
              </div>
            );
            if(cell.k==="center") return(
              <div key={ck} className="relative flex items-center justify-center overflow-hidden">
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                  <polygon points="50,50 0,0 100,0"    fill={C.GREEN}/>
                  <polygon points="50,50 100,0 100,100" fill={C.YELLOW}/>
                  <polygon points="50,50 100,100 0,100" fill={C.BLUE}/>
                  <polygon points="50,50 0,100 0,0"    fill={C.RED}/>
                  <polygon points="50,22 78,50 50,78 22,50" fill="white" opacity="0.95"/>
                </svg>
                <Tokens k="center" sm/>
              </div>
            );
            return(<div key={ck} style={{background:"#fff",border:"0.5px solid #e8dcc8"}}/>);
          }))}
        </div>
      </div>
    </div>
  );
}