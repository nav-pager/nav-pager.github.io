// define will automagically upgrade any existing (but undefined) Web Components in the DOM
customElements.define('nav-pager', class extends HTMLElement {
    get selected() {
        return this.querySelector("nav[selected]"); // no need for jQuery, querySelector available since IE9 (that was 2011)
    }

    get navElements() {
        return (this.navsquery = this.navsquery || [...this.querySelectorAll("nav")]) // convert NodeList to Array
        // do not cache when user/code can dynamically add <nav> elements, 
        // but this component does not handle that scenario, needs (partial) re-rendering
    }

    select(nav = this.selected || this.navElements[0]) {
        // remove "selected" from <span> pagenumbers and <nav>
        [...this.spanElements, ...this.navElements].map(el => {
            el.removeAttribute("selected");
            el.removeAttribute("aria-current"); // they are not on <span> but on <nav> We'll fix that later
        });
        // set selected on <span> page numbers and this <nav>
        [...nav.spanElements, nav].map(el => {
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
        //console.log(this.id, this.innerHTML.length); // most developers do not understand why this is 0 sometimes. See link
        setTimeout(() => this.render()); // wait till <nav-pager> innerHTML is parsed. See link
    }

    render(
        // Functions as parameter so we don't need "const " statements bloating our GZip file, also keeps function body clean

        // THE Helper Function you want to use in every Web Component (well, okay, maybe not every)
        createElement = (tag, props = {}) => Object.assign(document.createElement(tag), props),

        createPageSelector = (id, div) => {
            div = createElement("div", {
                part: "selector" + id // allow styling from Global CSS, what many blogs whine about
            }); // create <div> for all <span> pagenumbers
            div.append( // or you can add append to the Helper function above, but this WC only does it once
                this.getAttribute("pagelabel") || "Page: ", // prefix for pagenumbers
                ...this.navElements.map((nav, idx) => { // spread all <span> elements
                    let span = createElement("span", {
                        textContent: nav.title || ++idx, // use .title or new page number
                        part: "pagenr", // allow styling from Global CSS, what many blogs whine about
                        onclick: evt => this.select(nav) // no need for addEventListener, there is only one onclick PER span
                        // No removeListener required (in a disconnectedCallback), handler is garbage collected when the <span> is removed
                    }); // createElement <span>

                    this.spanElements.push(span); // store all <span> on <nav-pager>
                    (nav.spanElements = nav.spanElements || []).push(span); // store all <span> on matching <nav>

                    return span; // return all <span> as Array
                })
            );
            return div; // return the <div> with all <span>
        } // createPageSelector
    ) {
        this.render = () => { } // render once! because connectedCallback will be called on DOM mutations (like drag/drop)

        this.spanElements = []; // keep record of all <span> pagenumbers/titles

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
                createPageSelector("top"), // <div> with <span>
                this.pageslot = createElement("slot"), // for manual slot assignment. ONE <nav> will be _reflected_ here
                // note: You can't use this.slot because that IS a default property on HTMLElement
                createPageSelector("bottom"),
            ); // append

        this.select(); // initial display of a page

    } // render once

}); // define <nav-pages>
