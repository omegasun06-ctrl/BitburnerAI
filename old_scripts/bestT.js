function dfs(ns, root, prev = "", maxDepth = 3, hiScore, hiServer) {

  if (maxDepth == 0) {
    ns.print("server: " + hs[1] + " score: " + hs[0]);
    return hs;

  }

  //here we calculate the score with the formula:

  //score = (maxmoney*0.25/growth*growtime-5*weakentime)

  var maxmoney = ns.getServerMaxMoney(root);

  var growth = ns.getServerGrowth(root);

  var growt = ns.getGrowTime(root);

  var weakent = ns.getWeakenTime(root);

  var score = Math.log2(maxmoney * 0.25 / growth * growt - 5 * weakent);


  ns.print(root + "'s score is " + Math.floor(score) + " with maxmoney " + maxmoney + " gorwth " + growth + " growt " + growt + " weakent " + weakent);

  //below is for recursively crawling through the network

  var stats = ns.getServer(root)

  var adjList = ns.scan(root)

  var LL = adjList.length

  var hs = [hiScore, hiServer];

  for (var i = 0; i < LL; i++) {

    if (adjList[i] == prev) {

      continue;

    }

    if (score > hiScore) {
      hiScore = score;
      hiServer = root;
      ns.tprint("server: " + score + " score: " + root);
      // ns.print(root +" Score: " + Math.floor(score));
      dfs(ns, adjList[i], root, maxDepth - 1, hiScore, hiServer);

    }
    else {
      dfs(ns, adjList[i], root, maxDepth - 1, hiScore, hiServer);
    }

  }
  // ns.tprint(hs[1]+ " has the highest score of "+hs[0]);
  return hs ;
}

/** u/param {NS} ns **/

export async function main(ns) {

  var name = ns.args[0]

  if (name === undefined) {

    name = "home";

  }
  dfs(ns, name, "", 10, 0, "");
}
