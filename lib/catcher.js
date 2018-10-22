class WorkCatcher {
  constructor() {
    this.catchers = [];
  }
  
  catch(catcher) {
    this.catchers.push(catcher);
  }
  
  async rollback() {
    let i = this.catchers.length;
    while (i--) await this.catchers[i]();
  }
}

module.exports = async function(fn) {
  const catcher = new WorkCatcher();
  try{
    return await fn(catcher.catch.bind(catcher));
  } catch(e) {
    await catcher.rollback();
    throw e;
  }
};