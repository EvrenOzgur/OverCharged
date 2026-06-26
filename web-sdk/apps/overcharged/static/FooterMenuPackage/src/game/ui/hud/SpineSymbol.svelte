<script lang="ts">
    export let skin: string = 'H1';
    export let size: number = 80;

    const atlasMap: Record<string, { x: number, y: number, w: number, h: number }> = {
        'H1': { x: 2, y: 1193, w: 413, h: 384 },
        'H2': { x: 2, y: 1579, w: 512, h: 512 },
        'H3': { x: 341, y: 23, w: 344, h: 357 },
        'H4': { x: 406, y: 542, w: 394, h: 455 },
        'L1': { x: 2, y: 809, w: 402, h: 382 },
        'L2': { x: 2, y: 2, w: 337, h: 378 },
        'L3': { x: 2, y: 382, w: 376, h: 425 },
        'L4': { x: 808, y: 710, w: 288, h: 391 }
    };

    $: frame = atlasMap[skin] || atlasMap['H1'];
    
    // Scale factor to fit within `size`
    $: maxDim = Math.max(frame.w, frame.h);
    $: scale = size / maxDim;
    // We want the sprite to be visually centered and scaled down
</script>

<div class="symbol-container" style="width: {size}px; height: {size}px;">
    <div 
        class="symbol-sprite"
        style="
            width: {frame.w}px; 
            height: {frame.h}px;
            background-image: url('./assets/Symbols/skeleton.png');
            background-position: -{frame.x}px -{frame.y}px;
            transform: translate(-50%, -50%) scale({scale});
        "
    ></div>
</div>

<style>
    .symbol-container {
        position: relative;
        display: inline-block;
        flex-shrink: 0;
    }
    .symbol-sprite {
        position: absolute;
        top: 50%;
        left: 50%;
        background-repeat: no-repeat;
        /* we will handle translate(-50%, -50%) and scale in the inline style */
    }
</style>
