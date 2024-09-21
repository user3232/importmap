

export function replacePatternWith(
    /**
     * May contain `*`.
     */
    pattern: string,
    /**
     * String to replace `*`
     */
    starReplacer: string,
): string {
    
    const starIndex = pattern.indexOf('*')
    if(starIndex === -1) {
        return pattern
    }
    const prefix = pattern.slice(0, starIndex)
    const postfix = pattern.slice(starIndex + 1)
    return (prefix + starReplacer + postfix)
}
