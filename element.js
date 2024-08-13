// define will automagically upgrade any existing (but undefined) Web Components in the DOM
customElements.define('nav-pager', class extends HTMLElement {
    get selected() {
        return this.querySelector("nav[selected]"); // no need for jQuery, available since IE9 (that was 2011)
    }
    get navs() {
        return (this.navsquery = this.navsquery || [...this.querySelectorAll("nav")]) // convert NodeList to Array
        // do not cache when user/code can dynamically add <nav> elements, 
        // but this component does not handle that scenario, needs (partial) re-rendering
    }
    select(nav = this.selected || this.navs[0]) {
        // remove "selected" from <span> pagenumbers and <nav>
        [...this.spans, ...this.navs].map(el => {
            el.removeAttribute("selected");
            el.removeAttribute("aria-current"); // they are not on <span> but on <nav> We'll fix that later
        });
        // set selected on <span> page numbers and this <nav>
        [...nav.spans, nav].map(el => {
            el.setAttribute("selected", true)
        });
        nav.setAttribute("aria-current", "page");

        // target the one <slot> in shadowDOM and assign / _reflect_ ONE <nav> to it
        this.pageslot.assign(nav); // manual slot assigment
    }

    // The connectedCallback is a default callback. Executed when <nav-pages> Opening tag is parsed in the DOM
    // This is when you can access Attributes, add DOM or whatever
    // DO NOT read Attributes or do DOM operations in the (default) constructor!!! (except for your own added shadowDOM)
    // your code will break on document.createElement("your-component") ... which you most likely did not test
    connectedCallback() {
        //console.log(this.id, this.innerHTML.length); // most developers do not understand why this is 0 sometimes, see link below
        setTimeout(() => this.render()); // wait till <nav-pager> innerHTML is parsed. See link below
    }

    render() {
        this.render = () => { } // render once! because connectedCallback will be called on DOM mutations (like drag/drop)
        this.spans = []; // keep record of all <span> pagenumbers/titles
        this.pagelabel = this.getAttribute("pagelabel") || "Page: ";

        // THE Helper Function you will use in every Web Component (well, okay, maybe not every)
        const createElement = (tag, props = {}) => Object.assign(document.createElement(tag), props);

        const createPageSelector = () => this.navs.map((nav, idx) => {
            let span = createElement("span", {
                textContent: nav.title || ++idx, // use .title or new page number
                part: "pagenr", // allow styling from Global CSS, what the other half of the blogs whine about
                onclick: evt => this.select(nav) // no need for addEventListener, there is only one onclick required PER span
                // note: No removeListener required (in a disconnectedCallback), 
                // this handler is garbage collected when the <span> is removed
            }); // createElement <span>
            this.spans.push(span); // store all <span> on <nav-pager>
            (nav.spans = nav.spans || []).push(span); // store all <span> on matching <nav>
            return span; // return all <span> as Array
        }); // createPageSelector() returns Array of <span>

        this /* don't blindly copy MDN code, chain those statements, yes! super() can be chained too */
            .attachShadow({
                mode: "open",
                // do not automatically assign slot content (the default) This code will *assign* ONE <nav> element
                slotAssignment: "manual" // not often used, half of the blogs that whine about shadowDOM can maybe use this
            })
            .append( // Multiple! DOM elements OR plain text (which appendChild can't do) But (for safety) No HTML!
                createElement("style", {
                    textContent: ":host{display:block}" +
                        ":host{margin:5px 10px;user-select:none;-webkit-user-select:none;font-family:sans-serif}" +
                        "span{cursor:pointer;border:1px solid #ccc;padding:5px;display:inline-block}" +
                        "span[selected]{font-weight:bold;color:red}" +
                        "::slotted(*){display:block;background:var(--bgcolor,pink)}"
                    // note: there are VSCODE plugins that can syntax highlight the above strings...
                }),
                this.pagelabel, ...createPageSelector(), // spread all <span>
                this.pageslot = createElement("slot"), // for manual slot assignment. ONE <nav> will be _reflected_ here
                // note: You can't use this.slot because that IS a default property on HTMLElement
                this.pagelabel, ...createPageSelector(), // spread all <span>
            ); // append

        this.select();

    } // render
}); // define <nav-pages>
