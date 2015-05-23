(function(global,factory){
	if(typeof define === 'function' && define.cmd || define.amd){
		return define(factory)
	}else if(typeof module !== 'undefined' && module.exports){
		module.exports = factory()
	}else{
		global.R = factory()
	}
})(this,function(){
	var isReg = function(input){
		return Object.prototype.toString.call(input) === "[object RegExp]"
	}
	var isEqualPath = function(hostname){
		var hash = location.hash
		return hash.slice(0,hostname.length) === hostname
	}
	var getQuery = function(url){
		var ret = {}
		if(url.indexOf('?') !== -1){
			var query = url.slice(url.lastIndexOf('?') + 1)
			if(query){
				query = query.split('&')
				query.forEach(function(q){
					q = q.split('=')
					if(ret[q[0]]){
						ret[q[0]] = [].concat(ret[q[0]])
						ret[q[0]].push(q[1])
					}else{
						ret[q[0]] = q[1]
					}
				})
			}
		}
		return ret
	}
	var R = function(conf){
		var self = this
		if(!(self instanceof R)){
			self = Object.create(R.prototype)
		}
		self.separator = conf.separator ||  '!'
		self.base = conf.base || '/'
		self.hostname = '#' + self.separator + self.base
		self.urlFrom = self.hostname.length
		return self
	}

	R.prototype = {
		constructor: R,
		when: function(condition,cb,extra){
			R.queue.push(this.addRoute.bind(this,condition,cb))
			if(extra){
				R.stage[this.hostname + condition] = extra
			}
			return this
		},
		getPathname: function(){
			var ret = location.hash.slice(this.urlFrom)
			if(ret.indexOf('?') !== -1){
				ret = ret.slice(0,ret.indexOf('?'))
			}
			return ret
		},
		addRoute: function(condition,cb){
			if(isEqualPath(this.hostname)){
				var pathname = this.getPathname()
				if(isReg(condition)){
					var match = condition.exec(pathname)
					if(match){
						this.prefix(condition)
						cb.apply(this,[{
							query: getQuery(location.hash)
						}].concat(match.slice(1)))
					}
				}else{
					if(condition === pathname){
						this.prefix(condition)
						cb.call(this,{
							query: getQuery(location.hash)
						})
					}
				}
			}
			R.currentHash = location.hash
			return this
		},
		prefix: function(condition){
			if(R.curStage){
				R.stage[R.curStage] && R.stage[R.curStage].destroy()
			}
			R.curStage = this.hostname + condition
		}
	}
	// static
	R.stage = {}
	R.bindStatus = false
	R.currentHash = location.hash
	R.queue = []
	R.checkQueue = function(){
		R.queue.forEach(function(q){
			q()
		})
	}
	R.run = function(){
		if(!R.bindStatus){
			R.bindStatus = true
			window.addEventListener('hashchange',function(){
				if(R.currentHash === location.hash) return
				R.checkQueue()
			},false)
		}
		R.checkQueue()
	}
	return R
})