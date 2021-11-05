/*
 * Please note that v0.1.0 and v0.2.0 have never been properly versioned. Slight differences to the changelogs could be possible.
 */

class PoopScriptEnv {
    GLOBAL_VARS = {};
    #console = null;

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
            }
        },
    }

    /** Creates a new PoopScript Environment */
    constructor() {
        this.#console = console;
    }

    setCustomConsoleHandler(c) {
        this.#console = c;
    }

    exec(src) {
        var lines = src.split(";");
        var lineIndex = 0;

        for(var line of lines) {
            lineIndex++;

            var words = line.trim().split(" ");

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

            console.debug("Trying to execute: " + line + "; function: " + words[0]);

            var _obj = words[0].split("->")[0];
            var _method = words[0].split("->")[1];

            if(_obj == "") _obj = "__globalctx__";
            if(line.trim() == "") continue;

            if(_obj in this.GLOBAL_OBJECTS) {
                if(_method in this.GLOBAL_OBJECTS[_obj]) {
                    try {
                        this.GLOBAL_OBJECTS[_obj][_method](words);
                    }catch(err) {
                        throw("PSError: " + _obj + "->" + _method + ": " + err + " (at line " + lineIndex + ")");
                    }
                }else {
                    throw("PSError: Tried to execute " + _method + " at object " + _obj + " but there is no method named that. (at line " + lineIndex + ")");
                }
            }else {
                throw("PSError: Tried to access undefined object "  + _obj + " (at line " + lineIndex + ")");
            }
        }
    }
}