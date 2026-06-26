### FOOTER MENU UI IMPLEMENTATION SPECIFICATION



#### 1\. OVERVIEW



Component:

Footer Menu



Supported Orientations:

\- Landscape

\- Portrait



Reference Assets:

All exported PNG assets are Scale 1.0 assets.



Implementation Rules:

\- Recreate the hierarchy exactly as defined.

\- Use nested AutoLayout / Flex containers.

\- Avoid absolute positioning unless explicitly specified.

\- Text must remain editable and dynamic.

\- Decorative elements must not participate in layout calculations.

\- Scale the footer uniformly based on the Resolution \& Scaling table.

\- Child elements inherit the scale of their parent container.

\- Bonus Button is not part of FOOTER\_MENU in Landscape layout.





#### 2\. RESOLUTION \& SCALING



Landscape:



|**Screen Name**|**Resolution**|**Scale**|**Bottom Pading**|
|-|-|-|-|
|Desktop|1200X675|1.00|10 px|
|Laptop|1024X576|0.85|10 px|
|Popout-L|800X450|0.67|10 px|
|Popout-S|400X225|0.33|10 px|





Portrait:

|Screen Name|Resolution|Scale|Bottom Padding|
|-|-|-|-|
|Mobile-L|425x812|1.00|20 px|
|Mobile-M|375x667|0.88|20 px|
|Mobile-S|320x568|0.75|20 px|





Scaling Rules:

\- Apply scale to the root UI group for that orientation.

\- All children inherit the parent scale.

\- Do not scale child elements individually.

\- FOOTER\_BACKGROUND uses the same scale factor as FOOTER\_MENU.

\- BONUS\_BUTTON uses the same scale factor as the Landscape footer UI group.





#### 3\. LANDSCAPE MAIN HIERARCHY



LANDSCAPE\_FOOTER\_UI

├── BONUS\_BUTTON (png)

└── FOOTER\_MENU

&#x20;   ├── FOOTER\_BACKGROUND (png)

&#x20;   ├── LEFT\_SIDE

&#x20;   │   ├── MENU\_BUTTON (png)

&#x20;   │   └── BALANCE\_BLOCK

&#x20;   │       ├── BALANCE\_LABEL (text)

&#x20;   │       └── BALANCE\_AMOUNT (text)

&#x20;   │

&#x20;   ├── MIDDLE\_PART

&#x20;   │   ├── LAST\_WIN\_LABEL (text)

&#x20;   │   └── LAST\_WIN\_AMOUNT (text)

&#x20;   │

&#x20;   └── RIGHT\_SIDE

&#x20;       ├── BET\_PART

&#x20;       │   ├── BET\_INFO

&#x20;       │   │   ├── BET\_LABEL (text)

&#x20;       │   │   └── BET\_AMOUNT (text)

&#x20;       │   │

&#x20;       │   └── BET\_CONTROLS

&#x20;       │       ├── PLUS\_BUTTON (png)

&#x20;       │       └── MINUS\_BUTTON (png)

&#x20;       │

&#x20;       └── PLAY\_PART

&#x20;           ├── PLAY\_BUTTON (png)

&#x20;           └── PLAY\_OPTIONS

&#x20;               ├── AUTOPLAY\_BUTTON (png)

&#x20;               └── TURBO\_BUTTON (png)







## 4\. LANDSCAPE ROOT LAYOUT



##### LANDSCAPE\_FOOTER\_UI



Type:

Container / Group



Children:

\- BONUS\_BUTTON

\- FOOTER\_MENU



Alignment Rule:

\- FOOTER\_MENU is horizontally centered on the screen.

\- FOOTER\_MENU is anchored to the bottom of the screen using the Bottom Padding value from the scaling table.

\- BONUS\_BUTTON is positioned to the left side of FOOTER\_MENU.

\- BONUS\_BUTTON is vertically centered with FOOTER\_MENU.

\- BONUS\_BUTTON is not included inside FOOTER\_MENU AutoLayout.



Bonus Button Position Rule:

BONUS\_BUTTON.centerY = FOOTER\_MENU.centerY



BONUS\_BUTTON.right + GAP = FOOTER\_MENU.left



Gap Between BONUS\_BUTTON and FOOTER\_MENU: 10 px





#### 5\. FOOTER\_MENU LAYOUT SETTINGS



##### FOOTER\_MENU



Type: AutoLayout / Flex Container



Direction: Horizontal



Alignment: Center



Gap: Auto



Padding Left: 30 px



Padding Right: 30 px



Children Order:

1\. LEFT\_SIDE

2\. MIDDLE\_PART

3\. RIGHT\_SIDE





#### 6\. DECORATIVE LAYERS



##### FOOTER\_BACKGROUND



Type: Decorative Layer



Asset: footer\_background.png



Parent: FOOTER\_MENU



Alignment: Center / Center



Opacity: 60%



Scale: Inherits FOOTER\_MENU scale



Draw Order: Behind all footer content



Layout Participation: None



Interaction: None



Notes:

\- Decorative visual layer only.

\- Must not affect spacing, alignment or sizing calculations.

\- Must remain centered inside FOOTER\_MENU.

\- Must render behind LEFT\_SIDE, MIDDLE\_PART and RIGHT\_SIDE.





#### 7\. LANDSCAPE AUTO LAYOUT COMPONENTS



##### LEFT\_SIDE



Parent: FOOTER\_MENU



Type: AutoLayout / Flex Container



Direction: Horizontal



Alignment: Left



Gap: 10 px



Width/Height: Hug Content



Children Order:

1\. MENU\_BUTTON (png)

2\. BALANCE\_BLOCK





##### BALANCE\_BLOCK



Parent: LEFT\_SIDE



Type: AutoLayout / Flex Container



Direction: Vertical



Alignment: Left



Gap: 0 px



Width/Height: Hug Content



Children Order:

1\. BALANCE\_LABEL (text)

2\. BALANCE\_AMOUNT (text)





##### MIDDLE\_PART



Parent: FOOTER\_MENU



Type: AutoLayout / Flex Container



Direction: Vertical



Alignment: Center



Gap: 0 px



Width/Height: Hug Content



Children Order:

1\. LAST\_WIN\_LABEL (text)

2\. LAST\_WIN\_AMOUNT (text)





##### RIGHT\_SIDE



Parent: FOOTER\_MENU



Type: AutoLayout / Flex Container



Direction: Horizontal



Alignment: Right



Gap: 10 px



Width/Height: Hug Content



Children Order:

1\. BET\_PART

2\. PLAY\_PART





##### BET\_PART



Parent: RIGHT\_SIDE



Type: AutoLayout / Flex Container



Direction: Horizontal



Alignment: Right



Gap: 10 px



Width/Height: Hug Content



Children Order:

1\. BET\_INFO

2\. BET\_CONTROLS





##### BET\_INFO



Parent: BET\_PART



Type: AutoLayout / Flex Container



Direction: Vertical



Alignment: Right



Gap: 0 px



Width/Height: Hug Content



Children Order:

1\. BET\_LABEL (text)

2\. BET\_AMOUNT (text)





##### BET\_CONTROLS



Parent: BET\_PART



Type: AutoLayout / Flex Container



Direction: Vertical



Alignment: Right



Gap:6 px



Width/Height: Hug Content



Children Order:

1\. PLUS\_BUTTON (png)

2\. MINUS\_BUTTON (png)





##### PLAY\_PART



Parent: RIGHT\_SIDE



Type: AutoLayout / Flex Container



Direction: Horizontal



Alignment: Right



Gap:0 px



Width/Height: Hug Content



Children Order:

1\. PLAY\_BUTTON (png)

2\. PLAY\_OPTIONS



##### PLAY\_OPTIONS



Parent: PLAY\_PART



Type: AutoLayout / Flex Container



Direction: Vertical



Alignment: Right



Gap: 4 px



Width/Height: Hug Content



Children Order:

1\. AUTOPLAY\_BUTTON (png)

2\. TURBO\_BUTTON (png)



#### 8\. PORTRAIT MAIN HIERARCHY



PORTRAIT\_FOOTER\_UI

├── LAST\_WIN\_BLOCK

│   ├── LAST\_WIN\_LABEL (text)

│   └── LAST\_WIN\_AMOUNT (text)

├── TOP\_ROW (AutoLayout)

│   ├── MENU\_BUTTON (png)

│   ├── PLAY\_PART

│   │     ├── AUTOPLAY\_BUTTON (png)

│   │     ├── PLAY\_BUTTON (png)

│   │     └── TURBO\_BUTTON (png)

│   └── BONUS\_BUTTON (png)

│

└── BOTTOM\_ROW

&#x20;   ├── BALANCE\_BLOCK

&#x20;   │    ├── BALANCE\_LABEL (text)

&#x20;   │    └── BALANCE\_AMOUNT (text)

&#x20;   └── BET\_BLOCK

&#x20;        ├── BET\_LABEL

&#x20;        │    └── BET\_LABEL (text)

&#x20;        └── BET\_CONTROLS

&#x20;             ├── MINUS\_BUTTON (png)

&#x20;             ├── BET\_AMOUNT (text)

&#x20;             └── PLUS\_BUTTON (png)





## 9\. PORTRAIT ROOT LAYOUT



##### PORTRAIT\_FOOTER\_UI



Type: AutoLayout / Flex Container



Direction: Vertical



Alignment: Center



Gap: 0 px



Width: 400 px

Height: Hug Content



Children:



\* LAST\_WIN\_BLOCK

\* TOP\_ROW

\* BOTTOM\_ROW



Notes:



\* LAST\_WIN\_BLOCK, TOP\_ROW and BOTTOM\_ROW are part of the same AutoLayout.

\* TOP\_ROW and BOTTOM\_ROW each have their own decorative background asset.

\* LAST\_WIN\_BLOCK does not use a background image.



#### 10\. PORTRAIT DECORATIVE LAYERS



##### TOP\_ROW\_BACKGROUND



Type: Decorative Layer



Asset: portrait\_top\_row\_background.png



Parent: TOP\_ROW



Alignment: Center / Center



Opacity: 60%



Scale: Inherits PORTRAIT\_FOOTER\_UI scale



Draw Order: Behind all TOP\_ROW content



Layout Participation: None



Interaction: None



Notes:



\* Decorative visual layer only.

\* Must not affect spacing, alignment or sizing calculations.

\* Must remain centered behind TOP\_ROW.



##### BOTTOM\_ROW\_BACKGROUND



Type: Decorative Layer



Asset: portrait\_bottom\_row\_background.png



Parent: BOTTOM\_ROW



Alignment: Center / Center



Opacity: 60%



Scale: Inherits PORTRAIT\_FOOTER\_UI scale



Draw Order: Behind all BOTTOM\_ROW content



Layout Participation: None



Interaction: None



Notes:



\* Decorative visual layer only.

\* Must not affect spacing, alignment or sizing calculations.

\* Must remain centered behind BOTTOM\_ROW.



#### 11\. PORTRAIT AUTO LAYOUT COMPONENTS



##### LAST\_WIN\_BLOCK



Parent: PORTRAIT\_FOOTER\_UI



Type: AutoLayout / Flex Container



Direction: Horizontal



Alignment: Center



Gap: 4 px



Width: Fill Container

Height: Hug Content



Children Order:



1\. LAST\_WIN\_LABEL (text)

2\. LAST\_WIN\_AMOUNT (text)



##### TOP\_ROW



Parent: PORTRAIT\_FOOTER\_UI



Type: AutoLayout / Flex Container



Direction: Horizontal



Alignment: Center



Padding: 10 px



Gap: Auto



Width: Fill Container

Height: Hug Content



Children Order:



1\. MENU\_BUTTON (png)

2\. PLAY\_PART

3\. BONUS\_BUTTON (png)



PLAY\_PART



Parent: TOP\_ROW



Type: AutoLayout / Flex Container



Direction: Horizontal



Alignment: Center



Gap: 2 px



Width/Height: Hug Content



Children Order:



1\. AUTOPLAY\_BUTTON (png)

2\. PLAY\_BUTTON (png)

3\. TURBO\_BUTTON (png)





##### BOTTOM\_ROW



Parent: PORTRAIT\_FOOTER\_UI



Type: AutoLayout / Flex Container



Direction: Horizontal



Alignment: Center



Padding: 10 px



Gap: Auto



Width: Fill Container

Height: Hug Content



Children Order:



1\. BALANCE\_BLOCK

2\. BET\_BLOCK



BALANCE\_BLOCK



Parent: BOTTOM\_ROW



Type: AutoLayout / Flex Container



Direction: Vertical



Alignment: Left



Gap: 0 px



Width/Height: Hug Content



Children Order:



1\. BALANCE\_LABEL (text)

2\. BALANCE\_AMOUNT (text)



BET\_BLOCK



Parent: BOTTOM\_ROW



Type: AutoLayout / Flex Container



Direction: Vertical



Alignment: Right



Gap: 0 px



Width/Height: Hug Content



Children Order:



1\. BET\_LABEL

2\. BET\_INFO



BET\_LABEL



Parent: BET\_BLOCK



Type: AutoLayout / Flex Container



Direction: Horizontal



Alignment: Center



Gap: 0 px



Width: Fill Container

Height: Hug Content



Children Order:



1\. BET\_LABEL (text)





BET\_INFO



Parent: BET\_BLOCK



Type: AutoLayout / Flex Container



Direction: Horizontal



Alignment: Right



Gap: 16 px



Width/Height: Hug Content



Children Order:



1\. MINUS\_BUTTON (png)

2\. BET\_AMOUNT (text)

3\. PLUS BUTTON (png)





#### 12. GLOBAL COMPONENT DEFINITIONS



Notes:

\- Components are global and can be used in both Landscape and Portrait layouts.

\- Component scale is inherited from the active root layout scale.

\- Component placement is defined by the Landscape and Portrait hierarchy sections.

\- Do not assign components permanently to only one layout.

\- The same button assets are used in both Landscape and Portrait unless otherwise specified.





MENU\_BUTTON



Type: PNG Button



Assets:

btn\_menu\_default.png

btn\_menu\_hover.png





BONUS\_BUTTON



Type: PNG Button



Assets:

\- btn\_bonus\_default.png

\- btn\_bonus\_active.png



Landscape Placement:

\- Sibling of FOOTER\_MENU

\- Not inside FOOTER\_MENU

\- Positioned to the left of FOOTER\_MENU

\- Vertically centered with FOOTER\_MENU



Portrait Placement:

\- Defined by PORTRAIT\_FOOTER\_UI hierarchy





AUTOPLAY\_BUTTON



Type:

PNG Button



Assets:

\- btn\_autoplay\_default.png

\- btn\_autoplay\_hover.png

\- btn\_autoplay\_active.png

\- btn\_autoplay\_disabled.png





PLAY\_BUTTON



Type:

PNG Button



Assets:

\- btn\_play\_default.png

\- btn\_play\_hover.png

\- btn\_play\_stop.png

\- btn\_play\_disabled.png





TURBO\_BUTTON



Type:

PNG Button



Assets:

\- btn\_turbo\_default.png

\- btn\_turbo\_hover.png

\- btn\_turbo\_active.png

\- btn\_turbo\_disabled.png







PLUS\_BUTTON



Type:

PNG Button



Assets:

\- btn\_plus\_default.png

\- btn\_plus\_hover.png

\- btn\_plus\_pressed.png

\- btn\_plus\_disabled.png





MINUS\_BUTTON



Type:

PNG Button



Assets:

\- btn\_minus\_default.png

\- btn\_minus\_hover.png

\- btn\_minus\_pressed.png

\- btn\_minus\_disabled.png





FOOTER\_BACKGROUND



Type:

Decorative PNG Layer



Assets:

\- footer\_background.png



Used In:

\- Landscape layout only





TOP\_ROW\_BACKGROUND



Type:

Decorative PNG Layer



Assets:

\- portrait\_top\_row\_background.png



Used In:

\- Portrait layout only





BOTTOM\_ROW\_BACKGROUND



Type:

Decorative PNG Layer



Assets:

\- portrait\_bottom\_row\_background.png



Used In:

\- Portrait layout only







#### 13. TYPOGRAPHY



Font File:

Impact.ttf

Letter Spacing: 4%



Text must remain editable and dynamic.

Do not export dynamic text as PNG.



Typography is global unless an orientation-specific override is defined.



BALANCE\_LABEL

Text: BALANCE

Font Size: 20 px

Weight: Hug Content

Color: #FD9F1C

Alignment: Defined by parent layout



BALANCE\_AMOUNT

Text: Dynamic

Font Size: 24 px

Weight: Hug Content

Color: #FFFFFF

Alignment: Defined by parent layout



LAST\_WIN\_LABEL

Text: LAST WIN

Font Size: 20 px

Weight: Hug Content

Color: #1CFD2F

Alignment: Defined by parent layout



LAST\_WIN\_AMOUNT

Text: Dynamic

Font Size: 24 px

Weight: Hug Content

Color: #FFFFFF

Alignment: Defined by parent layout



BET\_LABEL

Text: BET

Font Size: 20 px

Weight: Hug Content

Color: #FD9F1C

Alignment: Defined by parent layout



BET\_AMOUNT

Text: Dynamic

Font Size: 24 px

Weight: Hug Content

Color: #FFFFFF

Alignment: Defined by parent layout









#### 14\. RENDER ORDER / DRAW ORDER



Notes:

\- Layout hierarchy defines structure and flow.

\- Draw Order defines which PNG/text is rendered in front or behind.

\- Decorative backgrounds must always render behind their row content.

\- Interactive buttons must render above decorative backgrounds.





Landscape Footer Draw Order:



1\. FOOTER\_BACKGROUND



2\. LEFT\_SIDE

&#x20;  - MENU\_BUTTON

&#x20;  - BALANCE\_BLOCK



3\. MIDDLE\_PART

&#x20;  - LAST\_WIN\_LABEL

&#x20;  - LAST\_WIN\_AMOUNT



4\. RIGHT\_SIDE

&#x20;  - BET\_PART

&#x20;  - PLAY\_PART



5\. BONUS\_BUTTON





Portrait Footer Draw Order:



1\. TOP\_ROW\_BACKGROUND

2\. TOP\_ROW content

&#x20;  - MENU\_BUTTON

&#x20;  - PLAY\_PART

&#x20;  - BONUS\_BUTTON



3\. BOTTOM\_ROW\_BACKGROUND

4\. BOTTOM\_ROW content

&#x20;  - BALANCE\_BLOCK

&#x20;  - BET\_BLOCK



5\. LAST\_WIN\_BLOCK



Notes:

\- LAST\_WIN\_BLOCK has no background.

\- TOP\_ROW\_BACKGROUND must stay behind TOP\_ROW only.

\- BOTTOM\_ROW\_BACKGROUND must stay behind BOTTOM\_ROW only.







## 

## 15. FOLDER STRUCTURE



UI\_SPEC/

\- FooterSpec.md



REFERENCE/

\- LandscapeReference.png

\- PortraitReference.png



FONTS/

\- Impact.ttf



ASSETS/

\- footer\_background.png

\- portrait\_top\_row\_background.png

\- portrait\_bottom\_row\_background.png

\- btn\_menu\_default.png

\- btn\_menu\_hover.png

\- btn\_bonus\_default.png

\- btn\_bonus\_active.png

\- btn\_autoplay\_default.png

\- btn\_autoplay\_hover.png

\- btn\_autoplay\_active.png

\- btn\_autoplay\_disabled.png

\- btn\_play\_default.png

\- btn\_play\_stop.png

\- btn\_play\_hover.png

\- btn\_play\_disabled.png

\- btn\_turbo\_default.png

\- btn\_turbo\_active.png

\- btn\_turbo\_hover.png

\- btn\_turbo\_disabled.png

\- btn\_plus\_default.png

\- btn\_plus\_disabled.png

\- btn\_plus\_hover.png

\- btn\_plus\_disabled.png

\- btn\_minus\_default.png

\- btn\_minus\_disabled.png

\- btn\_minus\_hover.png

\- btn\_minus\_disabled.png

