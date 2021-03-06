import "../../../entry";

import { assert } from "chai";

import { AsyncUtil } from "../../../util/AsyncUtil";
import { GenericEvent } from "../../../../src/org/osflash/signals/events/GenericEvent";
import { IBubbleEventHandler } from "../../../../src/org/osflash/signals/events/IBubbleEventHandler";
import { DeluxeSignal } from "../../../../src/org/osflash/signals/DeluxeSignal";
import { IEvent } from "../../../../src/org/osflash/signals/events/IEvent";

describe("DeluxeSignalWithBubblingEventTest", () => {
    let async: AsyncUtil = new AsyncUtil();

    let theParent: IBubbleEventHandler;
    let theChild: Child;
    let theGrandChild: Child;
    let cancelTimeout: Function;

    beforeEach(() => {
        theParent = this;
        theChild = new Child(this, "theChild");
        theGrandChild = new Child(theChild, "theGrandChild");
    });

    afterEach(() => {
        theChild = null;
        theGrandChild = null;
        cancelTimeout = null;
    });

    it("parent_child_relationships()", () => {
        assert.equal(this, theChild.parent, "theChild's parent is this");
        // TODO: find a way to typecheck for interfaces
        // assert.isTrue(this instanceof IBubbleEventHandler, "this can handle bubbling events");
    });

    it.skip("dispatch_bubbling_event_from_theGrandChild_should_bubble_to_parent_IBubbleHandler()", (done) => {
        // If cancelTimeout() isn"t called, this test will fail.
        cancelTimeout = async.add(null, 10);
        let event: IEvent = new GenericEvent();
        event.bubbles = true;

        theGrandChild.completed.dispatch(event);
    });

    function onEventBubbled(e: IEvent): boolean {
        cancelTimeout();
        assert.equal(theGrandChild, e.target, "e.target should be the object that originally dispatched event");
        assert.equal(this, e.currentTarget, "e.currentTarget should be the object receiving the bubbled event");
        return false;
    }

    // TODO: returning after throwing an error is not possible in TS
    it.skip("returning_false_from_onEventBubbled_should_stop_bubbling()", () => {
        let bubbleHater: BubbleHater = new BubbleHater();
        theChild = new Child(bubbleHater, "bubblePopper");
        theChild.popsBubbles = true;
        theGrandChild = new Child(theChild, "bubbleBlower");

        let bubblingEvent: IEvent = new GenericEvent(true);
        // Will only complete without error if theChild pops the bubble.
        theGrandChild.completed.dispatch(bubblingEvent);
    });

    // TODO: Check why the error is not thrown
    it.skip("returning_true_from_onEventBubbled_should_continue_bubbling()", () => {
        assert.throws(() => {
            let bubbleHater: BubbleHater = new BubbleHater();
            theChild = new Child(bubbleHater, "bubblePopper");
            // Changing popsBubbles to false will fail the test nicely.
            theChild.popsBubbles = false;
            theGrandChild = new Child(this.theChild, "bubbleBlower");

            let bubblingEvent: IEvent = new GenericEvent(true);
            // Because theChild didn"t pop the bubble, this causes bubbleHater to throw an error.
            theGrandChild.completed.dispatch(bubblingEvent);
        }, Error);
    });
});

class Child implements IBubbleEventHandler {
    public parent: Object;
    public completed: DeluxeSignal;
    public name: string;
    public popsBubbles: boolean = false;

    constructor(parent: Object = null, name = "") {
        this.parent = parent;
        this.name = name;
        this.completed = new DeluxeSignal(this);
    }

    public toString(): string {
        return "[Child " + this.name + "]";
    }

    public onEventBubbled(event: IEvent): boolean {
        return !this.popsBubbles;
    }
}

class BubbleHater implements IBubbleEventHandler {
    public onEventBubbled(event: IEvent): boolean {
        throw new Error("I SAID NO BUBBLES!!!");
    }
}
