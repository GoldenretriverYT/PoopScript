/*
 * Please note that v0.1.0 and v0.2.0 have never been properly versioned. Slight differences to the changelogs could be possible.
 */

class PoopScriptEnv {
    GLOBAL_VARS = {};
    #console = null;
    #strict = false;

    static removalTemplates = {
        "noJavaScript": ["__globalctx__->eval"],
        "simpleUsage": ["__globalctx__->alert", "__globalctx__->eval", "__globalctx__->throw", "__globalctx__->error"],
        "noVars": ["global->set", "global->unset"]
    };

    GLOBAL_OBJECTS = {
        __globalctx__: {
            "alert": (words) => {
                alert(words.splice(1).join(" "));
            },
            "log": (words) => {
                this.#console.log(words.splice(1).join(" "));
            },
            "warn": (words) => {
                this.#console.warn(words.splice(1).join(" "));
            },
            "error": (words) => {
                this.#console.error(words.splice(1).join(" "));
            },
            "throw": (words) => {
                throw(words.splice(1).join(" "));
            },
            "eval": (words) => {
                eval(words.splice(1).join(" "));
            }
        },
        math: {
            "sum": (words) => {
                return parseFloat(words[1]) + parseFloat(words[2]);
            },
            "sub": (words) => {
                return parseFloat(words[1]) - parseFloat(words[2]);
            },
            "div": (words) => {
                return parseFloat(words[1]) / parseFloat(words[2]);
            },
            "mul": (words) => {
                return parseFloat(words[1]) * parseFloat(words[2]);
            }
        },
        global: {
            "set": (words) => {
                if(words[1] == undefined) { // well, we DO need a name.
                    throw("No variable name passed to global->set");
                }

                if((words[1].match(/([^A-Za-z])+/g) || []).length > 0) { // find all matches of non-alpha chars or return empty array instead of NULL
                    throw("Invalid variable name - only alphabetic names are allowed.");
                }

                if(!(words[2] == "=")) { // This is to prevent accidentally not adding a name for the variable and then wondering why its never correctly replaced
                    throw("No equals sign when assigning variable. Make sure you dont forget the name and the equals sign!");
                }

                this.GLOBAL_VARS[words[1]] = words.splice(3).join(" ");
            },
            "assign": (words) => {
                if(words[1] == undefined) { // well, we DO need a name.
                    throw("No variable name passed to global->set");
                }

                if((words[1].match(/([^A-Za-z])+/g) || []).length > 0) { // find all matches of non-alpha chars or return empty array instead of NULL
                    throw("Invalid variable name - only alphabetic names are allowed.");
                }

                if(!(words[2] == "=")) { // This is to prevent accidentally not adding a name for the variable and then wondering why its never correctly replaced
                    throw("No equals sign when assigning variable. Make sure you dont forget the name and the equals sign!");
                }

                this.GLOBAL_VARS[words[1]] = this.exec(words.splice(3).join(" "));
            },
            "unset": (words) => {
                if(words[1] == undefined) { // well, we DO need a name.
                    throw("No variable name passed to global->unset");
                }

                if((words[1].match(/([^A-Za-z])+/g) || []).length > 0) { // find all matches of non-alpha chars or return empty array instead of NULL
                    throw("Invalid variable name - only alphabetic names are allowed.");
                }

                if(!(words[1] in this.GLOBAL_VARS)) {
                    if(this.#strict) {
                        throw("STRICT: There is no variable named " + words[1] + " to unset.");
                    }else {
                        return;
                    }
                }

                delete this.GLOBAL_VARS[words[1]];
            }
        },
        custom: {
            "run": (words) => {
                return this.exec(this.CUSTOM_FUNCTIONS[words[1]].join(";\n"));
            },
            "returnString": (words) => {
                return words.splice(1).join(" ");
            },
            "returnNumber": (words) => {
                return parseFloat(words[1]);
            }
        }
    }

    CUSTOM_FUNCTIONS = {
        
    }

    /** Creates a new PoopScript Environment */
    constructor(removalTemplate=[]) {
        this.#console = console;

        for(var rem of removalTemplate) {
            console.debug("removing " + rem);

            if(rem.split("->")[0] in this.GLOBAL_OBJECTS) {
                if(rem.split("->")[1] in this.GLOBAL_OBJECTS[rem.split("->")[0]]) {
                    delete this.GLOBAL_OBJECTS[rem.split("->")[0]][rem.split("->")[1]];
                }else {
                    console.warn("Template tried to delete " + this.GLOBAL_OBJECTS[rem.split("->")[0]][rem.split("->")[1]] + ", but that function was not found.");
                }
            }else {
                console.warn("Template tried to delete " + this.GLOBAL_OBJECTS[rem.split("->")[0]][rem.split("->")[1]] + ", but that function was not found.");
            }
        }
    }

    setCustomConsoleHandler(c) {
        this.#console = c;
    }
    
    /** Set if strict mode is enabled.
     * Strict mode throws errors at more places. (if you try to unset a undefined variable for example)
     */
    setStrict(b) {
        this.#strict = b;
    }

    exec(src) {
        var lines = src.split(";");
        var lineIndex = 0;

        var latestReturn = undefined;

        var currentlyDef = {
            is: false,
            name: "",
            lines: []
        }

        for(var line of lines) {
            lineIndex++;

            var words = line.trim().split(" ");

            if(words[0] == "-->def<--") {
                if(currentlyDef.is) throw("Already in definition mode. You cant define methods in methods.");

                currentlyDef = {
                    is: true,
                    name: words[1],
                    lines: []
                }

                continue;
            }else if(words[0] == "-->end<--") {
                currentlyDef.is = false;
                this.CUSTOM_FUNCTIONS[currentlyDef.name] = currentlyDef.lines.slice();

                continue;
            }

            if(currentlyDef.is) {
                currentlyDef.lines.push(line);
                continue; 
            }

            for(var i = 0; i < words.length; i++) {
                if(words[i].startsWith("%%")) {
                    if(!(words[i].split("%%")[1] in this.GLOBAL_VARS)) {
                        words[i] = "undefined";
                        continue;
                    }

                    words[i] = this.GLOBAL_VARS[words[i].split("%%")[1]];
                }else if(words[i].startsWith("%$")) {
                    console.warn("Local variables were removed.");
                }
            }

            var _obj = words[0].split("->")[0];
            var _method = words[0].split("->")[1];

            if(_obj == "") _obj = "__globalctx__";
            if(line.trim() == "") continue;

            if(_obj in this.GLOBAL_OBJECTS) {
                if(_method in this.GLOBAL_OBJECTS[_obj]) {
                    try {
                        latestReturn = this.GLOBAL_OBJECTS[_obj][_method](words);

                        if(_method == "returnString" || _method == "returnNumber") {
                            return latestReturn;
                        }
                    }catch(err) {
                        throw("PSError: Executing " + _obj + "->" + _method + " failed: " + err + " (at line " + lineIndex + ", line: " + line + ")");
                    }
                }else {
                    throw("PSError: Tried to execute " + _method + " at object " + _obj + " but there is no method named that. (at line " + lineIndex + ", line: " + line + ")");
                }
            }else {
                throw("PSError: Tried to access undefined object "  + _obj + " (at line " + lineIndex + ", line: " + line + ")");
            }
        }

        return latestReturn;
    }
}