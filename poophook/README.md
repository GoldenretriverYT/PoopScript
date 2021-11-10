# A sub-project for PoopScript.
PoopHook allows you to write and run your code in the browser and connect it with a NodeJS process running in the background. Apart from PooIDE, I can't really think of a use case. But PooIDE can also use functions like fs->read with PoopHook!

# How to use
PoopHook uses socket.io to receive commands to execute. Every PoopHook receives a unique key, and logs its ip + port to the console. To connect with it, use
`psh->hook <ip> <port> <key>` - if this fails due to an invalid ip, port or key it will throw an error. If it works, you can now use NodeJS-dependent features like `fs`!

# Security
This should be really only used for development purposes and for fun small projects with PoopScript. Make sure the port is not open on your network. Even though there is a key as a "security-check", I can't gurantee that its 100% secure. Apart from that,